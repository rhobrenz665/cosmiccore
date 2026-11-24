import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gt, inArray, isNull, lt, sql } from "drizzle-orm";
import { generateChatEvidence } from "@/lib/ai/chat-evidence";
import { reserveNoteAnswer } from "@/lib/ai/note-answer-quota";
import { retrieveSources } from "@/lib/retrieval/search-core";
import { selectNotePassage } from "@/lib/retrieval/note-passage";
import { requireAppUser } from "@/lib/auth/app-user";
import { openOwnedData } from "@/lib/db/owned-data";
import { chatConversations, chatTurns, notes, references } from "@/lib/db/schema";
import { withDbTransaction, type DbTransaction } from "@/lib/db/transaction";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function withChatOwner<T>(work: (tx: DbTransaction, ownerId: string) => Promise<T>) {
  const owner = await requireAppUser();
  return withDbTransaction(async tx => {
    await openOwnedData(tx, owner.id);
    return work(tx, owner.id);
  });
}

export function loadChat(id?: string) {
  return withChatOwner(async (tx, ownerId) => {
    const history = await tx.select().from(chatConversations)
      .where(eq(chatConversations.ownerId, ownerId))
      .orderBy(desc(chatConversations.updatedAt), desc(chatConversations.id)).limit(100);
    const selected = history.find(item => item.id === id);
    const turns = selected ? await tx.select().from(chatTurns).where(and(
      eq(chatTurns.ownerId, ownerId), eq(chatTurns.conversationId, selected.id),
    )).orderBy(asc(chatTurns.createdAt), asc(chatTurns.id)).limit(100) : [];
    const citationsFor = (turn: typeof chatTurns.$inferSelect) => turn.citations ??
      (turn.sourceKind && turn.sourceId && turn.sourceRevision !== null
        ? [{ kind: turn.sourceKind, sourceId: turn.sourceId, revision: turn.sourceRevision }] : []);
    const citations = turns.flatMap(citationsFor);
    const noteIds = citations.filter(source => source.kind === "note").map(source => source.sourceId);
    const referenceIds = citations.filter(source => source.kind === "reference").map(source => source.sourceId);
    const currentNotes = noteIds.length ? await tx.select({ id: notes.id, revision: notes.revision }).from(notes)
      .where(and(eq(notes.ownerId, ownerId), isNull(notes.deletedAt), inArray(notes.id, noteIds))) : [];
    const currentReferences = referenceIds.length ? await tx.select({ id: references.id, revision: references.revision }).from(references)
      .where(and(eq(references.ownerId, ownerId), inArray(references.id, referenceIds))) : [];
    return { history, selected, turns: turns.map(turn => ({
      id: turn.id, question: turn.question, answer: turn.answer,
      attemptStatus: turn.attemptStatus === "active" && turn.attemptExpiresAt &&
        turn.attemptExpiresAt.getTime() <= Date.now() ? "interrupted" : turn.attemptStatus,
      sources: citationsFor(turn).map(source => ({
        kind: source.kind,
        href: (source.kind === "note" ? currentNotes : currentReferences)
          .some(current => current.id === source.sourceId && current.revision === source.revision)
          ? `/${source.kind === "note" ? "notes" : "references"}/${source.sourceId}` : null,
      })),
    })) };
  });
}

export function saveQuestion(id: string, submissionId: string, question: string, create: boolean) {
  if (!uuid.test(id) || !uuid.test(submissionId) || !question || question.includes("\0") ||
      Buffer.byteLength(question) > 8192) return Promise.resolve(false);
  return withChatOwner(async (tx, ownerId) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${"cosmiccore:chat:" + ownerId}, 0))`);
    const [existing] = await tx.select().from(chatConversations).where(eq(chatConversations.id, id));
    if (existing && existing.ownerId !== ownerId) return false;
    if (!existing && !create) return false;

    const [prior] = await tx.select({ question: chatTurns.question }).from(chatTurns).where(and(
      eq(chatTurns.ownerId, ownerId), eq(chatTurns.conversationId, id), eq(chatTurns.submissionId, submissionId),
    ));
    if (prior) return prior.question === question;
    if (existing && create) return false;
    const [{ bytes, turns }] = (await tx.execute<{ bytes: number; turns: number }>(sql`
      select coalesce(sum(octet_length(question) + coalesce(octet_length(answer), 0)), 0)::int as bytes,
        count(*) filter (where conversation_id = ${id})::int as turns
      from ${chatTurns} where owner_id = ${ownerId}
    `)).rows;
    if (turns >= 100 || bytes + Buffer.byteLength(question) > 2 * 1024 * 1024) return false;
    if (!existing) {
      const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(chatConversations)
        .where(eq(chatConversations.ownerId, ownerId));
      if (count >= 100) return false;
      await tx.insert(chatConversations).values({ id, ownerId, title: Array.from(question).slice(0, 120).join("") });
    }
    await tx.insert(chatTurns).values({ ownerId, conversationId: id, submissionId, question });
    await tx.update(chatConversations).set({ updatedAt: new Date() }).where(and(
      eq(chatConversations.ownerId, ownerId), eq(chatConversations.id, id),
    ));
    return true;
  });
}

export function deleteChat(id: string) {
  if (!uuid.test(id)) return;
  return withChatOwner(async (tx, ownerId) => {
    await tx.delete(chatConversations).where(and(eq(chatConversations.ownerId, ownerId), eq(chatConversations.id, id)));
  });
}

export function answerChatQuestion(conversationId: string, turnId: string, stream?: { signal: AbortSignal; onProgress: () => void }) {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key || process.env.COSMICCORE_CHAT_ANSWERS_ENABLED !== "true" ||
      !uuid.test(conversationId) || !uuid.test(turnId)) return Promise.resolve("unavailable");

  return runAnswer(conversationId, turnId, key, stream);
}

async function runAnswer(conversationId: string, turnId: string, key: string, stream?: { signal: AbortSignal; onProgress: () => void }) {
  const attemptId = randomUUID();
  const prepare = await withChatOwner(async (tx, ownerId) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${"cosmiccore:chat:" + ownerId}, 0))`);
    const [active] = await tx.select({ id: chatTurns.id }).from(chatTurns).where(and(
      eq(chatTurns.ownerId, ownerId), eq(chatTurns.attemptStatus, "active"),
      gt(chatTurns.attemptExpiresAt, sql`clock_timestamp()`),
    )).limit(1);
    if (active) return { status: "active" } as const;
    const [turn] = await tx.select().from(chatTurns).where(and(
      eq(chatTurns.id, turnId), eq(chatTurns.conversationId, conversationId), eq(chatTurns.ownerId, ownerId),
    ));
    if (!turn) return { status: "unavailable" } as const;
    if (turn.answer) return { status: "saved" } as const;
    if (turn.question.length > 500) return { status: "long" } as const;
    const matches = await retrieveSources(tx, ownerId, turn.question);
    const sources = [];
    const seen = new Set<string>();
    for (const match of matches) {
      if (seen.has(match.sourceId)) continue;
      const excerpt = selectNotePassage(match.text, turn.question);
      if (!excerpt) continue;
      seen.add(match.sourceId);
      sources.push({
        kind: match.kind, sourceId: match.sourceId, revision: match.revision,
        passage: Array.from(excerpt).slice(0, 400).join(""),
      });
      if (sources.length === 3) break;
    }
    if (!sources.length) return { status: "insufficient" } as const;
    if (!await reserveNoteAnswer(tx, ownerId)) return { status: "limited" } as const;
    const previous = await tx.select({ question: chatTurns.question }).from(chatTurns).where(and(
      eq(chatTurns.ownerId, ownerId), eq(chatTurns.conversationId, conversationId),
      lt(chatTurns.createdAt, turn.createdAt), sql`${chatTurns.answer} is not null`,
    )).orderBy(desc(chatTurns.createdAt), desc(chatTurns.id)).limit(4);
    await tx.update(chatTurns).set({
      attemptId, attemptStatus: "active",
      attemptExpiresAt: sql`clock_timestamp() + interval '55 seconds'`,
    }).where(and(eq(chatTurns.id, turnId), eq(chatTurns.ownerId, ownerId)));
    return { question: turn.question, sources,
      previousQuestions: previous.reverse().map(item => Array.from(item.question).slice(0, 120).join("")) };
  });

  if ("status" in prepare) return prepare.status;
  let outcome = "unavailable";
  try {
    outcome = await finishAnswer();
    return outcome;
  } finally {
    await withChatOwner(async (tx, ownerId) => {
      await tx.update(chatTurns).set({ attemptStatus: outcome, attemptExpiresAt: null }).where(and(
        eq(chatTurns.id, turnId), eq(chatTurns.ownerId, ownerId), eq(chatTurns.attemptId, attemptId),
        eq(chatTurns.attemptStatus, "active"),
      ));
    });
  }

  async function finishAnswer() {
    if (!("sources" in prepare) || !prepare.sources) return "unavailable";
    if (stream?.signal.aborted) return "canceled";
    const { sources, question, previousQuestions } = prepare;
    const result = await generateChatEvidence(key, question, sources.map(source => source.passage), fetch, stream, previousQuestions);
    if (stream?.signal.aborted) return "canceled";
    if (result.kind === "rate-limited") return "limited";
    if (result.kind !== "answered") return result.kind;
    const answer = result.answer;
    const answerBytes = Buffer.byteLength(answer);
    if (answerBytes > 16384 || answer.includes("\0")) return "unavailable";

    return withChatOwner(async (tx, ownerId) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${"cosmiccore:chat:" + ownerId}, 0))`);
      for (const source of sources) {
        const table = source.kind === "note" ? notes : references;
        const [current] = await tx.select({ revision: table.revision }).from(table).where(and(
        eq(table.id, source.sourceId), eq(table.ownerId, ownerId), source.kind === "note" ? isNull(notes.deletedAt) : undefined,
      )).for("share");
        if (current?.revision !== source.revision) return "changed";
      }
      const [{ bytes }] = (await tx.execute<{ bytes: number }>(sql`
        select coalesce(sum(octet_length(question) + coalesce(octet_length(answer), 0)), 0)::int as bytes
        from ${chatTurns} where owner_id = ${ownerId}
      `)).rows;
      if (bytes + answerBytes > 2 * 1024 * 1024) return "limited";
      if (stream?.signal.aborted) return "canceled";
      const [saved] = await tx.update(chatTurns).set({
        answer, attemptStatus: "saved", attemptExpiresAt: null, citations: result.indices.map(index => {
          const { kind, sourceId, revision } = sources[index];
          return { kind, sourceId, revision };
        }),
      }).where(and(eq(chatTurns.id, turnId), eq(chatTurns.conversationId, conversationId),
        eq(chatTurns.ownerId, ownerId), eq(chatTurns.attemptId, attemptId),
        gt(chatTurns.attemptExpiresAt, sql`clock_timestamp()`), isNull(chatTurns.answer))).returning({ id: chatTurns.id });
      return saved ? "saved" : "unavailable";
    });
  }
}
