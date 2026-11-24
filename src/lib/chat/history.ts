import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { requireAppUser } from "@/lib/auth/app-user";
import { openOwnedData } from "@/lib/db/owned-data";
import { chatConversations, chatTurns } from "@/lib/db/schema";
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
    return { history, selected, turns };
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
