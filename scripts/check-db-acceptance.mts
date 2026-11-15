import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { and, eq, inArray, sql } from "drizzle-orm";
import { DataAccessError } from "../src/lib/db/owned-data.ts";
import { executeMutation, MutationError, type MutationHandler, type MutationRequest } from "../src/lib/db/mutation-core.ts";
import { accountQuotaLimits, type QuotaMetric, type QuotaPolicy } from "../src/lib/db/quota-policy.ts";
import { appUsers, globalQuotaUsage, mutationReceipts, notes, quotaUsage } from "../src/lib/db/schema.ts";
import { runTransaction, type DbTransaction } from "../src/lib/db/transaction-session.ts";

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required. Use development only.");
const databaseUrl = url;
const runId = randomUUID();
const issuer = `urn:cosmiccore:acceptance-check:${runId}`;
const owners = Array.from({ length: 8 }, () => randomUUID());
const base = Date.UTC(2100, 0, 1) + randomInt(100_000_000) * 60_000;
const windows = Array.from({ length: 8 }, (_, i) => new Date(base + i * 60_000));
const metrics: QuotaMetric[] = ["notes_count", "notes_bytes", "mutations_count"];
const policy: QuotaPolicy = { account: { ...accountQuotaLimits }, global: { ...accountQuotaLimits } };
const request = (): MutationRequest => ({ operation: "create_note", mutationId: randomUUID(), payload: { title: "Synthetic" } });
const transaction = <T,>(work: (tx: DbTransaction) => Promise<T>) => runTransaction(databaseUrl, work);
const hasCode = (code: string) => (error: unknown) => (error instanceof MutationError || error instanceof DataAccessError) && error.code === code;
function handler(beforeApply?: () => Promise<void>): MutationHandler {
  return {
    prepare: async (tx, ownerId) => ({
      changes: { notes_count: 1, notes_bytes: 9 },
      apply: async () => {
        await beforeApply?.();
        const [note] = await tx.insert(notes).values({ ownerId, title: "Synthetic" }).returning();
        return { entityId: note.id, revision: note.revision };
      },
    }),
    authorizeReplay: async (data, result) => { await data.getNote(result.entityId); },
  };
}
const mutate = (owner: string, r: MutationRequest, index: number, p = policy, h = handler()) =>
  transaction((tx) => executeMutation(tx, owner, r, p, h, windows[index], windows[index]));
function signal() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}
async function assertWaiting(pid: number) {
  // Observe an actual database lock wait rather than assuming scheduler timing.
  await transaction(async (tx) => {
    const deadline = Date.now() + 2000;
    while (Date.now() < deadline) {
      const result = await tx.execute<{ waiting: boolean }>(sql`select cardinality(pg_blocking_pids(${pid})) > 0 as waiting`);
      if (result.rows[0].waiting) return;
      await new Promise((done) => setTimeout(done, 25));
    }
    assert.fail("Expected competing transaction to wait on the held lock");
  });
}
async function block(tx: DbTransaction, owner: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`cosmiccore:mutation:${owner}`}, 0))`);
  await tx.update(appUsers).set({ status: "blocked" }).where(eq(appUsers.id, owner));
}
function describeFailure(error: unknown) {
  const chain: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current != null; depth++) {
    const value = current instanceof Error ? current : Object(current) as Record<string, unknown>;
    const name = typeof value.name === "string" ? value.name : value.constructor?.name ?? typeof current;
    const code = typeof value.code === "string" || typeof value.code === "number" ? ` code=${value.code}` : "";
    const message = typeof value.message === "string" && value.message.length > 0 ? value.message : "<empty message>";
    chain.push(`${name}${code}: ${message}`.replace(/postgres(ql)?:\/\/[^\s]+/gi, "<REDACTED_DATABASE_URL>").slice(0, 400));
    current = value.cause;
  }
  return chain.length ? chain.join(" <- ") : "<no error details>";
}
let stage = "fixture setup";
// Cleanup runs even if setup COMMIT acknowledgment is lost. Only exact reserved
// windows are removed, and only after matching synthetic identities are checked.
let reserved = false;
console.log(`Development final acceptance: ${runId}`);
console.log(`Synthetic accounting base: ${windows[0].toISOString()}`);
try {
  await transaction(async (tx) => {
    await tx.insert(appUsers).values(owners.map((id) => ({ id, authIssuer: issuer, authSubject: id, email: "acceptance@example.invalid", displayName: `acceptance-window:${windows[0].toISOString()}` })));
    await tx.insert(globalQuotaUsage).values(windows.flatMap((windowStart) => metrics.map((metric) => ({ metric, windowStart }))));
  });
  reserved = true;
  for (const [i, metric] of (["notes_count", "notes_bytes"] as const).entries()) {
    for (const scope of ["account", "global"] as const) {
      stage = `${scope} ${metric} race`;
      const index = i * 2 + (scope === "global" ? 1 : 0);
      const cap = metric === "notes_count" ? 1 : 9;
      const p = { ...policy, [scope]: { ...policy[scope], [metric]: cap } };
      const participants = scope === "account" ? [owners[index], owners[index]] : [owners[index], owners[index + 1]];
      const results = await Promise.allSettled(participants.map((owner) => mutate(owner, request(), index, p)));
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
      const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
      assert.ok(hasCode("QUOTA_EXCEEDED")(rejected.reason));
      await transaction(async (tx) => {
        const global = await tx.select().from(globalQuotaUsage).where(eq(globalQuotaUsage.windowStart, windows[index]));
        assert.equal(global.find((r) => r.metric === "notes_count")?.used, 1);
        assert.equal(global.find((r) => r.metric === "notes_bytes")?.used, 9);
        assert.equal(global.find((r) => r.metric === "mutations_count")?.used, 1);
        const receipts = await tx.select().from(mutationReceipts).where(and(inArray(mutationReceipts.ownerId, owners), eq(mutationReceipts.createdAt, windows[index])));
        assert.equal(receipts.length, 1);
        const [note] = await tx.select().from(notes).where(eq(notes.id, receipts[0].entityId));
        assert.equal(note.ownerId, receipts[0].ownerId);
        for (const owner of new Set(participants)) {
          const usage = await tx.select().from(quotaUsage).where(and(eq(quotaUsage.ownerId, owner), eq(quotaUsage.windowStart, windows[index])));
          const won = receipts[0].ownerId === owner;
          assert.equal(usage.find((r) => r.metric === "notes_count")?.used ?? 0, won ? 1 : 0);
          assert.equal(usage.find((r) => r.metric === "notes_bytes")?.used ?? 0, won ? 9 : 0);
        }
      });
      console.log(`PASS: concurrent ${scope} ${metric} reservations commit exactly one note/receipt and correct counters.`);
    }
  }

  stage = "write before account block";
  const held = signal();
  const release = signal();
  const started = signal();
  let pid = 0;
  const writer = mutate(owners[6], request(), 4, policy, handler(async () => { held.resolve(); await release.promise; }));
  // Attach rejection handlers immediately; release the gate even on assertion failure.
  void writer.catch(() => {});
  let blocker: Promise<void> | undefined;
  try {
    await Promise.race([held.promise, writer.then(() => { throw new Error("Writer did not hold its lock"); })]);
    blocker = transaction(async (tx) => {
      pid = (await tx.execute<{ pid: number }>(sql`select pg_backend_pid() as pid`)).rows[0].pid;
      started.resolve();
      await block(tx, owners[6]);
    });
    void blocker.catch(() => {});
    await Promise.race([started.promise, blocker]);
    await assertWaiting(pid);
  } finally {
    release.resolve();
    await Promise.allSettled([writer, ...(blocker ? [blocker] : [])]);
  }
  await writer;
  assert.ok(blocker);
  await blocker;
  await assert.rejects(mutate(owners[6], request(), 4), hasCode("ACCOUNT_UNAVAILABLE"));
  console.log("PASS: in-flight write precedes block; subsequent mutations are denied after block commits.");

  stage = "account block before write";
  const blocked = signal();
  const unblock = signal();
  const waiting = signal();
  const firstBlock = transaction(async (tx) => { await block(tx, owners[7]); blocked.resolve(); await unblock.promise; });
  void firstBlock.catch(() => {});
  let denied: Promise<unknown> | undefined;
  try {
    await Promise.race([blocked.promise, firstBlock]);
    denied = transaction(async (tx) => {
      pid = (await tx.execute<{ pid: number }>(sql`select pg_backend_pid() as pid`)).rows[0].pid;
      waiting.resolve();
      return executeMutation(tx, owners[7], request(), policy, handler(), windows[5], windows[5]);
    });
    void denied.catch(() => {});
    await Promise.race([waiting.promise, denied]);
    await assertWaiting(pid);
  } finally {
    unblock.resolve();
    await Promise.allSettled([firstBlock, ...(denied ? [denied] : [])]);
  }
  await firstBlock;
  assert.ok(denied);
  await assert.rejects(denied, hasCode("ACCOUNT_UNAVAILABLE"));
  await transaction(async (tx) => {
    assert.equal((await tx.select().from(notes).where(eq(notes.ownerId, owners[7]))).length, 0);
    assert.equal((await tx.select().from(mutationReceipts).where(eq(mutationReceipts.ownerId, owners[7]))).length, 0);
    assert.equal((await tx.select().from(quotaUsage).where(eq(quotaUsage.ownerId, owners[7]))).length, 0);
  });
  console.log("PASS: committed block denies the waiting write without content, counters or receipt.");

  stage = "simulated lost response and retry reconciliation";
  const uncertain = request();
  const original = await mutate(owners[5], uncertain, 6);
  // Deliberately discard the acknowledged result as a client would after losing
  // its response. This is not a real socket failure during COMMIT.
  const replay = await mutate(owners[5], uncertain, 6);
  assert.equal(replay.replayed, true);
  assert.equal(replay.entityId, original.entityId);
  const aborted = request();
  const injected = new Error("Synthetic precommit failure");
  await assert.rejects(mutate(owners[5], aborted, 7, policy, handler(async () => { throw injected; })), (e) => e === injected);
  const retried = await mutate(owners[5], aborted, 7);
  assert.equal(retried.replayed, false);
  await transaction(async (tx) => {
    for (const index of [6, 7]) {
      const rows = await tx.select().from(globalQuotaUsage).where(eq(globalQuotaUsage.windowStart, windows[index]));
      assert.equal(rows.find((r) => r.metric === "notes_count")?.used, 1);
      assert.equal(rows.find((r) => r.metric === "notes_bytes")?.used, 9);
      assert.equal(rows.find((r) => r.metric === "mutations_count")?.used, 1);
    }
  });
  console.log("PASS: retry reconciles simulated lost success and rolled-back failure without duplicate accounting.");

  stage = "own-session idle disconnect and rollback";
  const disconnected = request();
  // Server terminates only this transaction's idle connection. No backend-kill
  // privileges, network toggles or other sessions are involved.
  let timeoutArmed = false;
  await assert.rejects(transaction(async (tx) => {
    await executeMutation(tx, owners[5], disconnected, policy, handler(), windows[7], windows[7]);
    await tx.execute(sql`select set_config('idle_in_transaction_session_timeout', '1000', true)`);
    timeoutArmed = true;
    await new Promise((done) => setTimeout(done, 1600));
    await tx.execute(sql`select 1`);
    // Fail and roll back if the target does not enforce the timeout.
    throw new Error("Idle disconnect was not enforced");
  }), (error: unknown) => {
    // A connection error event can reject the transport before the delayed
    // query runs. Accept actual disconnect diagnostics in either path, not a
    // generic watchdog timeout or our "not enforced" failure.
    if (!timeoutArmed) return false;
    let cause = error;
    for (let depth = 0; depth < 5 && cause instanceof Error; depth++) {
      if (("code" in cause && cause.code === "25P03") || /connection (?:terminated|closed)|terminating connection|not queryable|websocket.*closed/i.test(cause.message)) return true;
      cause = cause.cause;
    }
    return false;
  });
  await transaction(async (tx) => {
    assert.equal((await tx.select().from(mutationReceipts).where(and(eq(mutationReceipts.ownerId, owners[5]), eq(mutationReceipts.mutationId, disconnected.mutationId)))).length, 0);
    assert.equal((await tx.select().from(notes).where(eq(notes.ownerId, owners[5]))).length, 2);
    const account = await tx.select().from(quotaUsage).where(and(eq(quotaUsage.ownerId, owners[5]), eq(quotaUsage.windowStart, windows[7])));
    assert.equal(account.find((r) => r.metric === "notes_count")?.used, 1);
    assert.equal(account.find((r) => r.metric === "notes_bytes")?.used, 9);
    assert.equal(account.find((r) => r.metric === "mutations_count")?.used, 1);
    const rows = await tx.select().from(globalQuotaUsage).where(eq(globalQuotaUsage.windowStart, windows[7]));
    assert.equal(rows.find((r) => r.metric === "notes_count")?.used, 1);
    assert.equal(rows.find((r) => r.metric === "notes_bytes")?.used, 9);
    assert.equal(rows.find((r) => r.metric === "mutations_count")?.used, 1);
  });
  assert.equal((await mutate(owners[5], disconnected, 7)).replayed, false);
  console.log("PASS: own-session disconnect rolls back receipt/accounting; a fresh connection retries successfully.");
} catch (error) {
  console.error(`Acceptance failed during ${stage}: ${describeFailure(error)} Preserve run ID ${runId}; do not share credentials.`);
  process.exitCode = 1;
} finally {
  try {
    await transaction(async (tx) => {
      const matching = await tx.select({ id: appUsers.id }).from(appUsers).where(and(eq(appUsers.authIssuer, issuer), inArray(appUsers.id, owners)));
      if (reserved || matching.length === owners.length) {
        await tx.delete(appUsers).where(and(eq(appUsers.authIssuer, issuer), inArray(appUsers.id, owners)));
        await tx.delete(globalQuotaUsage).where(and(inArray(globalQuotaUsage.metric, metrics), inArray(globalQuotaUsage.windowStart, windows)));
      }
      assert.equal((await tx.select().from(appUsers).where(eq(appUsers.authIssuer, issuer))).length, 0);
      for (const table of [notes, mutationReceipts, quotaUsage]) {
        assert.equal((await tx.select().from(table).where(inArray(table.ownerId, owners))).length, 0);
      }
      if (reserved || matching.length === owners.length) {
        assert.equal((await tx.select().from(globalQuotaUsage).where(inArray(globalQuotaUsage.windowStart, windows))).length, 0);
      }
    });
    console.log("Synthetic acceptance fixtures cleaned up.");
  } catch {
    console.error(`Acceptance cleanup failed. Stop and report run ID ${runId}.`);
    process.exitCode = 1;
  }
}
if (!process.exitCode) console.log("Final database acceptance checks passed. Synthetic fixtures were removed.");
