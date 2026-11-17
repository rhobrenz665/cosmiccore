import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { DbTransaction } from "../db/transaction-session.ts";
import { globalQuotaUsage, notes, quotaUsage } from "../db/schema.ts";

const MAX_BATCH_SIZE = 100;
const EPOCH = new Date(0);

export type PurgeBatchResult = { purgedCount: number; remainingExpired: boolean };

/** Internal primitive. Call only from a trusted operator after caller authentication. */
export async function purgeExpiredNotesWithTransaction(withDbTransaction: <T>(work: (tx: DbTransaction) => Promise<T>) => Promise<T>, batchSize = 50): Promise<PurgeBatchResult> {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > MAX_BATCH_SIZE) {
    throw new TypeError(`batchSize must be between 1 and ${MAX_BATCH_SIZE}.`);
  }
  const owners = await withDbTransaction(async (tx) => {
    const rows = await tx.selectDistinct({ ownerId: notes.ownerId }).from(notes)
      .where(and(sql`${notes.deletedAt} is not null`, sql`${notes.purgeAfter} <= clock_timestamp()`))
      .orderBy(asc(notes.ownerId)).limit(batchSize);
    return rows.map((row) => row.ownerId);
  });
  let purgedCount = 0;
  for (const ownerId of owners) {
    purgedCount += await withDbTransaction(async (tx) => {
      // Match application mutation ordering: owner lock, global usage,
      // account usage, then note rows. Keep this order across all writers.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`cosmiccore:mutation:${ownerId}`}, 0))`);
      await tx.insert(globalQuotaUsage).values([
        { metric: "notes_count", windowStart: EPOCH }, { metric: "notes_bytes", windowStart: EPOCH },
      ]).onConflictDoNothing();
      const global = await tx.select({ metric: globalQuotaUsage.metric, used: globalQuotaUsage.used })
        .from(globalQuotaUsage).where(and(inArray(globalQuotaUsage.metric, ["notes_count", "notes_bytes"]), eq(globalQuotaUsage.windowStart, EPOCH)))
        .orderBy(asc(globalQuotaUsage.metric)).for("update");
      await tx.insert(quotaUsage).values([
        { ownerId, metric: "notes_count", windowStart: EPOCH }, { ownerId, metric: "notes_bytes", windowStart: EPOCH },
      ]).onConflictDoNothing();
      const account = await tx.select({ metric: quotaUsage.metric, used: quotaUsage.used }).from(quotaUsage)
        .where(and(eq(quotaUsage.ownerId, ownerId), inArray(quotaUsage.metric, ["notes_count", "notes_bytes"]), eq(quotaUsage.windowStart, EPOCH)))
        .orderBy(asc(quotaUsage.metric)).for("update");
      const expired = await tx.select({ id: notes.id, storageBytes: notes.storageBytes }).from(notes)
        .where(and(eq(notes.ownerId, ownerId), sql`${notes.deletedAt} is not null`, sql`${notes.purgeAfter} <= clock_timestamp()`))
        .orderBy(asc(notes.purgeAfter), asc(notes.id)).limit(batchSize).for("update", { skipLocked: true });
      if (!expired.length) return 0;
      const count = expired.length;
      const bytes = expired.reduce((total, note) => total + note.storageBytes, 0);
      const globalUsed = Object.fromEntries(global.map((row) => [row.metric, row.used]));
      const accountUsed = Object.fromEntries(account.map((row) => [row.metric, row.used]));
      for (const metric of ["notes_count", "notes_bytes"] as const) {
        const delta = metric === "notes_count" ? count : bytes;
        if (!Number.isSafeInteger(delta) || globalUsed[metric] < delta || accountUsed[metric] < delta) {
          throw new Error("Note quota accounting is inconsistent; purge batch rolled back.");
        }
      }
      const ids = expired.map((note) => note.id);
      await tx.delete(notes).where(and(eq(notes.ownerId, ownerId), inArray(notes.id, ids)));
      for (const [table, metric, delta] of [
        [globalQuotaUsage, "notes_count", count], [globalQuotaUsage, "notes_bytes", bytes],
        [quotaUsage, "notes_count", count], [quotaUsage, "notes_bytes", bytes],
      ] as const) {
        await tx.update(table).set({ used: sql`${table.used} - ${delta}`, updatedAt: sql`clock_timestamp()` })
          .where(and(eq(table.metric, metric), eq(table.windowStart, EPOCH), ...(table === quotaUsage ? [eq(quotaUsage.ownerId, ownerId)] : [])));
      }
      return count;
    });
  }
  const remainingExpired = await withDbTransaction(async (tx) => {
    const [row] = await tx.select({ id: notes.id }).from(notes)
      .where(and(sql`${notes.deletedAt} is not null`, sql`${notes.purgeAfter} <= clock_timestamp()`)).limit(1);
    return Boolean(row);
  });
  return { purgedCount, remainingExpired };
}
