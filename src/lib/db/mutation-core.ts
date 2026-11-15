import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";

import { openOwnedData, type OwnedData } from "./owned-data.ts";
import { globalQuotaUsage, mutationReceipts, quotaUsage } from "./schema.ts";
import { quotaMetrics, type QuotaMetric, type QuotaPolicy, type UsageChanges } from "./quota-policy.ts";
import type { DbTransaction } from "./transaction-session.ts";

export class MutationError extends Error {
  readonly code: "VALIDATION" | "EXPIRED" | "QUOTA_EXCEEDED" | "RATE_LIMITED" | "DEPENDENCY_UNAVAILABLE";
  readonly retryAfterSeconds?: number;
  constructor(code: MutationError["code"], retryAfterSeconds?: number) {
    super(code === "RATE_LIMITED" ? "Mutation rate limit reached." : code === "QUOTA_EXCEEDED" ? "Storage or resource limit reached." : code === "EXPIRED" ? "Mutation retry window expired." : code === "VALIDATION" ? "Invalid mutation request." : "Usage accounting is unavailable.");
    this.name = "MutationError";
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export type MutationRequest = { operation: string; mutationId: string; payload: unknown };
export type ReceiptMetadata = Pick<typeof mutationReceipts.$inferInsert,
  "entityId" | "revision" | "affectedCount" | "resultUpdatedAt" | "deletedAt" | "purgeAfter">;
export type MutationHandler = {
  // Trusted feature service: validate input, owner/state/revision and derive
  // actual count/UTF-8 byte deltas here, inside the serialized transaction.
  prepare: (tx: DbTransaction, ownerId: string, data: OwnedData) => Promise<{
    changes: UsageChanges;
    apply: () => Promise<ReceiptMetadata>;
  }>;
  // Required even for receipt replays: enforce current resource lifecycle.
  // Delete handlers may authorize their own metadata-only receipt tombstone.
  authorizeReplay: (data: OwnedData, result: ReceiptMetadata) => Promise<void>;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function fingerprintPayload(payload: unknown): string {
  let bytes = 0;
  let nodes = 0;
  function encode(value: unknown, depth: number): string {
    if (depth > 32 || ++nodes > 10_000) throw new MutationError("VALIDATION");
    if (value === null || typeof value === "boolean" || typeof value === "string" || (typeof value === "number" && Number.isFinite(value))) {
      const encoded = JSON.stringify(value);
      bytes += Buffer.byteLength(encoded);
      if (bytes > 1024 * 1024) throw new MutationError("VALIDATION");
      return encoded;
    }
    if (Array.isArray(value) && value.length <= 128) {
      return `[${Array.from(value, (item) => encode(item, depth + 1)).join(",")}]`;
    }
    if (typeof value === "object" && value !== null && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
      const keys = Object.keys(value).sort();
      if (keys.length <= 128) return `{${keys.map((key) => `${encode(key, depth + 1)}:${encode((value as Record<string, unknown>)[key], depth + 1)}`).join(",")}}`;
    }
    throw new MutationError("VALIDATION");
  }
  const encoded = encode(payload, 0);
  if (Buffer.byteLength(encoded) > 1024 * 1024) throw new MutationError("VALIDATION");
  return createHash("sha256").update(encoded).digest("hex");
}

function metadata(result: ReceiptMetadata) {
  if (!uuid.test(result.entityId) || (result.revision != null && (!Number.isSafeInteger(result.revision) || result.revision < 1)) || !Number.isInteger(result.affectedCount ?? 0) || (result.affectedCount ?? 0) < 0 || (result.affectedCount ?? 0) > 2147483647) {
    throw new MutationError("VALIDATION");
  }
  for (const date of [result.resultUpdatedAt, result.deletedAt, result.purgeAfter]) {
    if (date != null && (!(date instanceof Date) || !Number.isFinite(date.getTime()))) throw new MutationError("VALIDATION");
  }
  // Explicit allowlist also strips unexpected extra fields on server objects.
  return {
    entityId: result.entityId.toLowerCase(), revision: result.revision ?? null,
    affectedCount: result.affectedCount ?? 0, resultUpdatedAt: result.resultUpdatedAt ?? null,
    deletedAt: result.deletedAt ?? null, purgeAfter: result.purgeAfter ?? null,
  };
}

async function reserveUsage(tx: DbTransaction, ownerId: string, changes: UsageChanges, policy: QuotaPolicy, now: Date) {
  const deltas: Partial<Record<QuotaMetric, number>> = { ...changes, mutations_count: 1 };
  for (const [metric, delta] of Object.entries(changes)) {
    if (!(quotaMetrics as readonly string[]).includes(metric) || metric === "mutations_count" || !Number.isSafeInteger(delta)) throw new MutationError("VALIDATION");
  }
  const metrics = quotaMetrics.filter((metric) => deltas[metric] !== undefined).sort();
  const windowFor = (metric: QuotaMetric) => new Date(metric === "mutations_count" ? Math.floor(now.getTime() / 60_000) * 60_000 : 0);

  // Acquire every global row before any per-account usage row, in stable order.
  // Inserts use the same order, including competing first-use initialization.
  const globalRows = new Map<QuotaMetric, number>();
  const accountRows = new Map<QuotaMetric, number>();
  for (const metric of metrics) {
    const windowStart = windowFor(metric);
    await tx.insert(globalQuotaUsage).values({ metric, windowStart }).onConflictDoNothing();
    const [row] = await tx.select({ used: globalQuotaUsage.used }).from(globalQuotaUsage)
      .where(and(eq(globalQuotaUsage.metric, metric), eq(globalQuotaUsage.windowStart, windowStart))).for("update");
    globalRows.set(metric, row.used);
  }
  for (const metric of metrics) {
    const windowStart = windowFor(metric);
    await tx.insert(quotaUsage).values({ ownerId, metric, windowStart }).onConflictDoNothing();
    const [row] = await tx.select({ used: quotaUsage.used }).from(quotaUsage)
      .where(and(eq(quotaUsage.ownerId, ownerId), eq(quotaUsage.metric, metric), eq(quotaUsage.windowStart, windowStart))).for("update");
    accountRows.set(metric, row.used);
  }
  for (const metric of metrics) {
    const delta = deltas[metric]!;
    for (const [used, limit] of [[globalRows.get(metric)!, policy.global[metric]], [accountRows.get(metric)!, policy.account[metric]]]) {
      const next = used + delta;
      if (!Number.isSafeInteger(limit) || limit < 0 || !Number.isSafeInteger(next) || next < 0) throw new MutationError("DEPENDENCY_UNAVAILABLE");
      // A lowered cap must still permit releases and unchanged storage.
      if (delta > 0 && next > limit) {
        if (metric === "mutations_count") throw new MutationError("RATE_LIMITED", Math.max(1, Math.ceil((windowFor(metric).getTime() + 60_000 - now.getTime()) / 1000)));
        throw new MutationError("QUOTA_EXCEEDED");
      }
    }
  }
  for (const metric of metrics) {
    const windowStart = windowFor(metric);
    await tx.update(globalQuotaUsage).set({ used: globalRows.get(metric)! + deltas[metric]!, updatedAt: now })
      .where(and(eq(globalQuotaUsage.metric, metric), eq(globalQuotaUsage.windowStart, windowStart)));
    await tx.update(quotaUsage).set({ used: accountRows.get(metric)! + deltas[metric]!, updatedAt: now })
      .where(and(eq(quotaUsage.ownerId, ownerId), eq(quotaUsage.metric, metric), eq(quotaUsage.windowStart, windowStart)));
  }
}

// Internal only; the server-only wrapper supplies identity, configuration and a
// real database clock. testNow exists solely for isolated manual test windows.
export async function executeMutation(tx: DbTransaction, ownerId: string, request: MutationRequest, policy: QuotaPolicy, handler: MutationHandler, testNow?: Date) {
  if (!uuid.test(ownerId) || !uuid.test(request.mutationId) || !/^[a-z][a-z_]{0,63}$/.test(request.operation)) throw new MutationError("VALIDATION");
  const payloadHash = fingerprintPayload(request.payload);
  const mutationId = request.mutationId.toLowerCase();
  ownerId = ownerId.toLowerCase();
  // Serialize an owner's mutations before account/receipt/usage locks. Hash
  // collisions only cause extra serialization; they cannot grant access.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`cosmiccore:mutation:${ownerId}`}, 0))`);
  const data = await openOwnedData(tx, ownerId);
  const clock = await tx.execute<{ now: string }>(sql`select clock_timestamp()::text as now`);
  const now = testNow ?? new Date(clock.rows[0].now);
  if (!Number.isFinite(now.getTime())) throw new MutationError("VALIDATION");
  const receiptWhere = and(eq(mutationReceipts.ownerId, ownerId), eq(mutationReceipts.operation, request.operation), eq(mutationReceipts.mutationId, mutationId));
  const [receipt] = await tx.select().from(mutationReceipts).where(receiptWhere);
  if (receipt) {
    if (receipt.payloadHash !== payloadHash) throw new MutationError("VALIDATION");
    if (receipt.expiresAt.getTime() <= now.getTime()) throw new MutationError("EXPIRED");
    const result = metadata(receipt);
    await handler.authorizeReplay(data, result);
    return { ...result, replayed: true };
  }
  const prepared = await handler.prepare(tx, ownerId, data);
  await reserveUsage(tx, ownerId, prepared.changes, policy, now);
  const result = metadata(await prepared.apply());
  await handler.authorizeReplay(data, result);
  await tx.insert(mutationReceipts).values({
    ...result, ownerId, operation: request.operation, mutationId, payloadHash,
    createdAt: now, expiresAt: new Date(now.getTime() + 24 * 3600_000),
  });
  return { ...result, replayed: false };
}
