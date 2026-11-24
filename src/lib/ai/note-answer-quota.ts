import { and, eq, sql } from "drizzle-orm";
import { globalQuotaUsage, quotaUsage } from "../db/schema.ts";
import type { DbTransaction } from "../db/transaction-session.ts";

const metric = "note_answers_count";

export async function reserveNoteAnswer(tx: DbTransaction, ownerId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('cosmiccore:note-answer', 0))`);
  const { rows } = await tx.execute<{ now_ms: number }>(sql`select (extract(epoch from clock_timestamp()) * 1000)::float8 as now_ms`);
  const now = new Date(rows[0].now_ms);
  const day = new Date(now);
  day.setUTCHours(0, 0, 0, 0);

  const globalDay = and(eq(globalQuotaUsage.metric, metric), eq(globalQuotaUsage.windowStart, day));
  const ownerDay = and(eq(quotaUsage.ownerId, ownerId), eq(quotaUsage.metric, metric), eq(quotaUsage.windowStart, day));
  const [latest] = await tx.select({ updatedAt: globalQuotaUsage.updatedAt })
    .from(globalQuotaUsage).where(eq(globalQuotaUsage.metric, metric))
    .orderBy(sql`${globalQuotaUsage.windowStart} desc`).limit(1);
  if (latest && now.getTime() - latest.updatedAt.getTime() < 61_000) return false;

  const [global] = await tx.select({ used: globalQuotaUsage.used }).from(globalQuotaUsage).where(globalDay);
  const [owner] = await tx.select({ used: quotaUsage.used }).from(quotaUsage).where(ownerDay);
  if ((global?.used ?? 0) >= 24 || (owner?.used ?? 0) >= 5) return false;

  await tx.insert(globalQuotaUsage).values({ metric, windowStart: day, used: 1, updatedAt: now })
    .onConflictDoUpdate({ target: [globalQuotaUsage.metric, globalQuotaUsage.windowStart],
      set: { used: (global?.used ?? 0) + 1, updatedAt: now } });
  await tx.insert(quotaUsage).values({ ownerId, metric, windowStart: day, used: 1, updatedAt: now })
    .onConflictDoUpdate({ target: [quotaUsage.ownerId, quotaUsage.metric, quotaUsage.windowStart],
      set: { used: (owner?.used ?? 0) + 1, updatedAt: now } });
  return true;
}
