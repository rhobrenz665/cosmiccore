import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { and, eq, inArray } from "drizzle-orm";
import { DataAccessError } from "../src/lib/db/owned-data.ts";
import { executeMutation, MutationError, type MutationHandler, type MutationRequest } from "../src/lib/db/mutation-core.ts";
import { accountQuotaLimits, type QuotaPolicy, type UsageChanges } from "../src/lib/db/quota-policy.ts";
import { appUsers, globalQuotaUsage, mutationReceipts, notes, quotaUsage } from "../src/lib/db/schema.ts";
import { runTransaction, type DbTransaction } from "../src/lib/db/transaction-session.ts";

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required. Use your development environment.");
const databaseUrl = url;
const runId = randomUUID();
const issuer = `urn:cosmiccore:mutation-check:${runId}`;
const ownerA = randomUUID();
const ownerB = randomUUID();
const rollback = new Error("Rollback mutation fixtures");
const policy: QuotaPolicy = { account: { ...accountQuotaLimits }, global: { ...accountQuotaLimits, notes_count: 1_000_000, notes_bytes: 100_000_000, mutations_count: 1000 } };
const now = new Date();
const baseWindow = Date.UTC(2100, 0, 1) + randomInt(100_000_000) * 60_000;
const windows = Array.from({ length: 4 }, (_, i) => new Date(baseWindow + i * 60_000));
let setupComplete = false;
let stage = "rollback checks";
console.log(`Development mutation check: ${runId}`);

const request = (payload: unknown = { title: "Synthetic" }, mutationId = randomUUID()): MutationRequest => ({ operation: "create_note", mutationId, payload });
const hasCode = (code: MutationError["code"] | "ACCOUNT_UNAVAILABLE" | "NOT_FOUND") => (error: unknown) =>
  (error instanceof MutationError || error instanceof DataAccessError) && error.code === code;

function createNoteHandler(changes: UsageChanges = { notes_count: 1, notes_bytes: 9 }, fail = false): MutationHandler {
  return {
    prepare: async (tx, ownerId) => ({
      changes,
      apply: async () => {
        const [note] = await tx.insert(notes).values({ ownerId, title: "Synthetic" }).returning();
        if (fail) throw rollback;
        return { entityId: note.id, revision: note.revision, resultUpdatedAt: note.updatedAt };
      },
    }),
    authorizeReplay: async (data, result) => { await data.getNote(result.entityId); },
  };
}

async function createOwners(tx: DbTransaction) {
  await tx.insert(appUsers).values([ownerA, ownerB].map((id) => ({
    id, authIssuer: issuer, authSubject: id, email: "mutation-check@example.invalid",
  })));
}

try {
  await assert.rejects(runTransaction(databaseUrl, async (tx) => {
    await createOwners(tx);
    const first = request();
    const initial = await executeMutation(tx, ownerA, first, policy, createNoteHandler(), now);
    const replay = await executeMutation(tx, ownerA, first, policy, createNoteHandler(), now);
    assert.equal(initial.replayed, false);
    assert.equal(replay.replayed, true);
    assert.equal(initial.entityId, replay.entityId);
    const usage = await tx.select().from(quotaUsage).where(and(eq(quotaUsage.ownerId, ownerA), eq(quotaUsage.metric, "notes_count")));
    assert.equal(usage[0].used, 1);
    // Every expected failure uses a savepoint; never catch and commit partial work.
    const attempt = (r: MutationRequest, p = policy, h = createNoteHandler(), clock = now) =>
      tx.transaction((nested) => executeMutation(nested, ownerA, r, p, h, clock));
    await assert.rejects(attempt({ ...first, payload: { title: "Changed" } }), hasCode("VALIDATION"));
    await assert.rejects(attempt(first, policy, createNoteHandler(), new Date(now.getTime() + 24 * 3600_000)), hasCode("EXPIRED"));
    await tx.update(notes).set({ deletedAt: now, purgeAfter: new Date(now.getTime() + 168 * 3600_000) }).where(eq(notes.id, initial.entityId));
    await assert.rejects(attempt(first), hasCode("NOT_FOUND"));
    await tx.update(notes).set({ deletedAt: null, purgeAfter: null }).where(eq(notes.id, initial.entityId));
    console.log("PASS: retry replay avoids duplicate accounting; payload changes, expiry and Trash reject replay.");

    const failed = request();
    await assert.rejects(attempt(failed, policy, createNoteHandler(undefined, true)), (error) => error === rollback);
    assert.equal((await tx.select().from(mutationReceipts).where(and(eq(mutationReceipts.ownerId, ownerA), eq(mutationReceipts.mutationId, failed.mutationId)))).length, 0);
    const retained = await tx.select().from(notes).where(eq(notes.ownerId, ownerA));
    assert.equal(retained.length, 1);
    const usageAfterFailure = await tx.select().from(quotaUsage).where(and(eq(quotaUsage.ownerId, ownerA), eq(quotaUsage.metric, "notes_count")));
    assert.equal(usageAfterFailure[0].used, 1);
    await assert.rejects(attempt(request(), { account: { ...policy.account, notes_count: 1 }, global: policy.global }), hasCode("QUOTA_EXCEEDED"));
    await assert.rejects(attempt(request(), { account: policy.account, global: { ...policy.global, notes_bytes: 0 } }), hasCode("QUOTA_EXCEEDED"));
    await assert.rejects(attempt(request(), policy, createNoteHandler({ notes_count: -2 })), hasCode("DEPENDENCY_UNAVAILABLE"));
    const stableUsage = await tx.select().from(quotaUsage).where(eq(quotaUsage.ownerId, ownerA));
    assert.equal(stableUsage.find((row) => row.metric === "notes_count")?.used, 1);
    assert.equal(stableUsage.find((row) => row.metric === "notes_bytes")?.used, 9);
    assert.equal(stableUsage.find((row) => row.metric === "mutations_count")?.used, 1);
    assert.equal((await tx.select().from(notes).where(eq(notes.ownerId, ownerA))).length, 1);
    assert.equal((await tx.select().from(mutationReceipts).where(eq(mutationReceipts.ownerId, ownerA))).length, 1);
    console.log("PASS: callback errors and quota rejection roll back content/counters/receipts; underflow is rejected.");

    const releaseRequest = { ...request(), operation: "delete_note" };
    const releaseHandler: MutationHandler = {
      prepare: async () => ({ changes: { notes_count: -1, notes_bytes: -9 }, apply: async () => {
        await tx.delete(notes).where(and(eq(notes.ownerId, ownerA), eq(notes.id, initial.entityId)));
        return { entityId: initial.entityId };
      } }),
      authorizeReplay: async () => {}, // Own metadata-only delete receipt; no content.
    };
    await executeMutation(tx, ownerA, releaseRequest, policy, releaseHandler, now);
    const releaseReplay = await executeMutation(tx, ownerA, releaseRequest, policy, releaseHandler, now);
    assert.equal(releaseReplay.replayed, true);
    const released = await tx.select().from(quotaUsage).where(and(eq(quotaUsage.ownerId, ownerA), eq(quotaUsage.metric, "notes_count")));
    assert.equal(released[0].used, 0);
    await tx.update(appUsers).set({ status: "blocked" }).where(eq(appUsers.id, ownerA));
    await assert.rejects(attempt(releaseRequest, policy, releaseHandler), hasCode("ACCOUNT_UNAVAILABLE"));
    console.log("PASS: release replay does not decrement twice; blocked accounts cannot replay receipts.");
    throw rollback;
  }), (error) => error === rollback);

  stage = "concurrency setup";
  await runTransaction(databaseUrl, async (tx) => {
    await createOwners(tx);
    // Exclusive synthetic future-minute rows: never reuse live global windows.
    await tx.insert(globalQuotaUsage).values(windows.map((windowStart) => ({ metric: "mutations_count" as const, windowStart })));
  });
  setupComplete = true;
  const race = (ownerId: string, r: MutationRequest, p: QuotaPolicy, clock: Date) =>
    runTransaction(databaseUrl, (tx) => executeMutation(tx, ownerId, r, p, createNoteHandler({}), clock));
  // Rate-only concurrency fixtures intentionally do not charge lifetime storage.
  const cappedAccount = { account: { ...policy.account, mutations_count: 1 }, global: policy.global };
  stage = "concurrent duplicate receipts";
  const duplicate = request();
  const duplicates = await Promise.allSettled([race(ownerA, duplicate, cappedAccount, windows[0]), race(ownerA, duplicate, cappedAccount, windows[0])]);
  assert.equal(duplicates.filter((r) => r.status === "fulfilled").length, 2);
  const duplicateResults = duplicates.map((r) => { assert.equal(r.status, "fulfilled"); return (r as PromiseFulfilledResult<Awaited<ReturnType<typeof race>>>).value; });
  assert.equal(duplicateResults[0].entityId, duplicateResults[1].entityId);
  assert.equal(duplicateResults.filter((r) => r.replayed).length, 1);
  console.log("PASS: concurrent retries commit one mutation and one receipt.");

  stage = "account rate race";
  const accountRace = await Promise.allSettled([race(ownerA, request(), cappedAccount, windows[1]), race(ownerA, request(), cappedAccount, windows[1])]);
  assert.equal(accountRace.filter((r) => r.status === "fulfilled").length, 1);
  const accountFailure = accountRace.find((r) => r.status === "rejected") as PromiseRejectedResult;
  assert.equal(hasCode("RATE_LIMITED")(accountFailure.reason), true);
  assert.ok(accountFailure.reason.retryAfterSeconds >= 1 && accountFailure.reason.retryAfterSeconds <= 60);
  console.log("PASS: concurrent distinct mutations cannot exceed the account rate cap.");

  stage = "global rate race";
  const cappedGlobal = { account: policy.account, global: { ...policy.global, mutations_count: 1 } };
  const globalRace = await Promise.allSettled([race(ownerA, request(), cappedGlobal, windows[2]), race(ownerB, request(), cappedGlobal, windows[2])]);
  assert.equal(globalRace.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(hasCode("RATE_LIMITED")((globalRace.find((r) => r.status === "rejected") as PromiseRejectedResult).reason), true);
  console.log("PASS: mutations from different owners cannot exceed the shared global cap.");

  stage = "owner receipt isolation";
  const sharedId = request();
  const separate = await Promise.allSettled([race(ownerA, sharedId, policy, windows[3]), race(ownerB, sharedId, policy, windows[3])]);
  assert.equal(separate.filter((r) => r.status === "fulfilled").length, 2);
  const separateResults = separate.map((r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof race>>>).value);
  assert.notEqual(separateResults[0].entityId, separateResults[1].entityId);
  await runTransaction(databaseUrl, async (tx) => {
    const totals = await tx.select().from(globalQuotaUsage).where(and(eq(globalQuotaUsage.metric, "mutations_count"), inArray(globalQuotaUsage.windowStart, windows))).orderBy(globalQuotaUsage.windowStart);
    assert.deepEqual(totals.map((row) => row.used), [1, 1, 1, 2]);
  });
  console.log("PASS: identical mutation IDs across owners stay independent; global accounting matches committed work.");
} catch {
  console.error(`Mutation check failed during ${stage}. Preserve run ID ${runId}; do not share credentials.`);
  process.exitCode = 1;
} finally {
  if (setupComplete) {
    try {
      await runTransaction(databaseUrl, async (tx) => {
        await tx.delete(appUsers).where(and(eq(appUsers.authIssuer, issuer), inArray(appUsers.id, [ownerA, ownerB])));
        await tx.delete(globalQuotaUsage).where(and(eq(globalQuotaUsage.metric, "mutations_count"), inArray(globalQuotaUsage.windowStart, windows)));
        assert.equal((await tx.select({ id: appUsers.id }).from(appUsers).where(eq(appUsers.authIssuer, issuer))).length, 0);
        assert.equal((await tx.select({ id: notes.id }).from(notes).where(inArray(notes.ownerId, [ownerA, ownerB]))).length, 0);
        assert.equal((await tx.select().from(globalQuotaUsage).where(and(eq(globalQuotaUsage.metric, "mutations_count"), inArray(globalQuotaUsage.windowStart, windows)))).length, 0);
      });
      console.log("Synthetic committed race fixtures cleaned up.");
    } catch {
      console.error(`Fixture cleanup failed for run ${runId}. Stop and report this run ID.`);
      process.exitCode = 1;
    }
  }
}
if (!process.exitCode) console.log("Mutation checks passed. Synthetic fixtures were removed.");
