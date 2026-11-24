import "server-only";

import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { generateNoteAnswer } from "@/lib/ai/note-answer";
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
    const noteIds = turns.flatMap(turn => turn.sourceKind === "note" && turn.sourceId ? [turn.sourceId] : []);
    const referenceIds = turns.flatMap(turn => turn.sourceKind === "reference" && turn.sourceId ? [turn.sourceId] : []);
    const currentNotes = noteIds.length ? await tx.select({ id: notes.id, revision: notes.revision }).from(notes)
      .where(and(eq(notes.ownerId, ownerId), isNull(notes.deletedAt), inArray(notes.id, noteIds))) : [];
    const currentReferences = referenceIds.length ? await tx.select({ id: references.id, revision: references.revision }).from(references)
      .where(and(eq(references.ownerId, ownerId), inArray(references.id, referenceIds))) : [];
    return { history, selected, turns: turns.map(turn => ({
      id: turn.id, question: turn.question, answer: turn.answer, sourceKind: turn.sourceKind,
      sourceHref: turn.sourceId && (turn.sourceKind === "note" ? currentNotes : currentReferences)
        .some(source => source.id === turn.sourceId && source.revision === turn.sourceRevision)
        ? `/${turn.sourceKind === "note" ? "notes" : "references"}/${turn.sourceId}` : null,
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

export function answerChatQuestion(conversationId: string, turnId: string) {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key || process.env.COSMICCORE_CHAT_ANSWERS_ENABLED !== "true" ||
      !uuid.test(conversationId) || !uuid.test(turnId)) return Promise.resolve("unavailable");

  return runAnswer(conversationId, turnId, key);
}

async function runAnswer(conversationId: string, turnId: string, key: string) {
  const prepare = await withChatOwner(async (tx, ownerId) => {
    const [turn] = await tx.select().from(chatTurns).where(and(
      eq(chatTurns.id, turnId), eq(chatTurns.conversationId, conversationId), eq(chatTurns.ownerId, ownerId),
    ));
    if (!turn) return { status: "unavailable" } as const;
    if (turn.answer) return { status: "saved" } as const;
    if (turn.question.length > 500) return { status: "long" } as const;
    const matches = await retrieveSources(tx, ownerId, turn.question);
    let source;
    let passage;
    for (const match of matches) {
      const excerpt = selectNotePassage([match.title, match.text].join("\n"), turn.question);
      if (excerpt) {
        source = match;
        passage = excerpt;
        break;
      }
    }
    if (!source || !passage) return { status: "insufficient" } as const;
    if (!await reserveNoteAnswer(tx, ownerId)) return { status: "limited" } as const;
    return { question: turn.question, source, passage };
  });

  if ("status" in prepare) return prepare.status;
  const { source, question, passage } = prepare;
  const result = await generateNoteAnswer(key, { question, passage });
  if (result.kind === "rate-limited") return "limited";
  if (result.kind !== "answered") return result.kind;
  const answer = result.answer;
  const answerBytes = Buffer.byteLength(answer);
  if (answerBytes > 16384 || answer.includes("\0")) return "unavailable";

  return withChatOwner(async (tx, ownerId) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${"cosmiccore:chat:" + ownerId}, 0))`);
    const table = source.kind === "note" ? notes : references;
    const [current] = await tx.select({ revision: table.revision }).from(table).where(and(
      eq(table.id, source.sourceId), eq(table.ownerId, ownerId), source.kind === "note" ? isNull(notes.deletedAt) : undefined,
    )).for("share");
    if (current?.revision !== source.revision) return "changed";
    const [{ bytes }] = (await tx.execute<{ bytes: number }>(sql`
      select coalesce(sum(octet_length(question) + coalesce(octet_length(answer), 0)), 0)::int as bytes
      from ${chatTurns} where owner_id = ${ownerId}
    `)).rows;
    if (bytes + answerBytes > 2 * 1024 * 1024) return "limited";
    const [saved] = await tx.update(chatTurns).set({
      answer, sourceKind: source.kind, sourceId: source.sourceId, sourceRevision: source.revision,
    }).where(and(eq(chatTurns.id, turnId), eq(chatTurns.conversationId, conversationId),
      eq(chatTurns.ownerId, ownerId), isNull(chatTurns.answer))).returning({ id: chatTurns.id });
    return saved ? "saved" : "unavailable";
  });
}
