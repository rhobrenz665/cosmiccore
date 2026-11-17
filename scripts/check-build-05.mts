import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { and, eq, inArray, sql } from "drizzle-orm";
import { runTransaction } from "../src/lib/db/transaction-session.ts";
import { appUsers, collections, globalQuotaUsage, mutationReceipts, notes, quotaUsage, tags } from "../src/lib/db/schema.ts";
import { purgeExpiredNotesWithTransaction } from "../src/lib/notes/purge-core.ts";
import { openOwnedData } from "../src/lib/db/owned-data.ts";
import { executeMutation, MutationError } from "../src/lib/db/mutation-core.ts";

const env = parseEnv(readFileSync(".env.acceptance.local", "utf8"));
const url = env.COSMICCORE_TEST_DATABASE_URL;
if (!url || env.COSMICCORE_TEST_PROJECT_ID !== "lingering-fire-94844546") throw new Error("Isolated acceptance configuration required.");
const target = new URL(url);
if (target.pathname !== "/cosmiccore_dev" || target.hostname !== "ep-rough-pond-azt24vit-pooler.c-3.ap-southeast-1.aws.neon.tech") throw new Error("Refusing unexpected test database.");
const purgeExpiredNotes = (size: number) => purgeExpiredNotesWithTransaction((work) => runTransaction(url, work), size);
const run = randomUUID();
const owner = randomUUID();
const other = randomUUID();
const issuer = `urn:cosmiccore:build-05:${run}`;
const epoch = new Date(0);
const storageWindow = new Date("2200-01-01T00:00:00.000Z");
const limits = { notes_count: 1_000_000, notes_bytes: 1_000_000, references_count: 1_000_000, references_bytes: 1_000_000, collections_count: 1_000_000, tags_count: 1_000_000, mutations_count: 1_000_000 } as const;
const policy = { account: limits, global: limits };
const lifecycle = (tx: Parameters<typeof executeMutation>[0], ownerId: string, noteId: string, action: "trash" | "restore", expectedRevision: number, mutationId = randomUUID()) => {
  const mutationNow = new Date();
  return executeMutation(tx, ownerId, {
  operation: action === "trash" ? "trash_note" : "restore_note", mutationId, payload: { noteId, expectedRevision },
}, policy, {
  prepare: async (transaction, authenticatedOwner, data) => {
    const current = await data.lockNoteLifecycle(noteId);
    if (action === "trash" ? current.deletedAt !== null : current.deletedAt === null) throw new Error("wrong lifecycle state");
    if (current.revision !== expectedRevision) throw new Error("revision conflict");
    return { changes: {}, apply: async () => {
      const deletedAt = action === "trash" ? mutationNow : null;
      const purgeAfter = deletedAt ? new Date(deletedAt.getTime() + 168 * 3600_000) : null;
      const [changed] = await transaction.update(notes).set({ deletedAt, purgeAfter, revision: sql`${notes.revision} + 1`, updatedAt: mutationNow })
        .where(and(eq(notes.id, noteId), eq(notes.ownerId, authenticatedOwner), eq(notes.revision, expectedRevision), action === "restore" ? sql`${notes.purgeAfter} > clock_timestamp()` : sql`${notes.deletedAt} is null`))
        .returning({ entityId: notes.id, revision: notes.revision, deletedAt: notes.deletedAt, purgeAfter: notes.purgeAfter, resultUpdatedAt: notes.updatedAt });
      if (!changed) throw new MutationError("EXPIRED");
      return changed;
    } };
  },
  authorizeReplay: async (data, receipt) => { if (action === "restore") await data.getNote(receipt.entityId); },
}, mutationNow, storageWindow);
};
const saveMutation = (tx: Parameters<typeof executeMutation>[0], ownerId: string, noteId: string, expectedRevision: number, body: string, mutationId = randomUUID()) => executeMutation(tx, ownerId, {
  operation: "save_note", mutationId, payload: { noteId, expectedRevision, body },
}, policy, {
  prepare: async (transaction, authenticatedOwner, data) => {
    const current = await data.lockNoteForUpdate(noteId);
    if (current.revision !== expectedRevision) throw new Error("revision conflict");
    return { changes: { notes_bytes: Buffer.byteLength(body, "utf8") - current.storageBytes }, apply: async () => {
      const [changed] = await transaction.update(notes).set({ body, revision: sql`${notes.revision} + 1`, updatedAt: sql`clock_timestamp()` })
        .where(and(eq(notes.id, noteId), eq(notes.ownerId, authenticatedOwner), eq(notes.revision, expectedRevision), sql`${notes.deletedAt} is null`))
        .returning({ entityId: notes.id, revision: notes.revision, resultUpdatedAt: notes.updatedAt });
      if (!changed) throw new Error("NOT_FOUND");
      return changed;
    } };
  },
  authorizeReplay: async (data, result) => { await data.getNote(result.entityId); },
}, new Date(), storageWindow);
let fixtureNoteIds: string[] = [];
const fixtureMutationIds = new Set<string>();
let fixtureCollectionId = "";
let fixtureTagId = "";
let lifecycleNoteId = "";
console.log(`BUILD-05 acceptance run: ${run}`);

try {
  await runTransaction(url, async (tx) => {
    // Refuse a populated target before invoking the database-wide purge.
    const counts = await tx.execute<{ note_count: number; account_usage: number; global_usage: number }>(sql`select (select count(*)::int from notes) as note_count, (select count(*)::int from quota_usage) as account_usage, (select count(*)::int from global_quota_usage) as global_usage`);
    assert.deepEqual(counts.rows[0], { note_count: 0, account_usage: 0, global_usage: 0 });
    await tx.insert(appUsers).values({ id: owner, authIssuer: issuer, authSubject: owner, email: "build-05@example.invalid" });
    await tx.insert(appUsers).values({ id: other, authIssuer: issuer, authSubject: other, email: "build-05-other@example.invalid" });
    await tx.insert(globalQuotaUsage).values([
      { metric: "notes_count", windowStart: epoch, used: 4 },
      { metric: "notes_bytes", windowStart: epoch, used: 36 },
    ]).onConflictDoUpdate({ target: [globalQuotaUsage.metric, globalQuotaUsage.windowStart], set: { used: sql`${globalQuotaUsage.used} + excluded.used` } });
    await tx.insert(quotaUsage).values([
      { ownerId: owner, metric: "notes_count", windowStart: epoch, used: 3 },
      { ownerId: owner, metric: "notes_bytes", windowStart: epoch, used: 28 },
      { ownerId: other, metric: "notes_count", windowStart: epoch, used: 1 },
      { ownerId: other, metric: "notes_bytes", windowStart: epoch, used: 8 },
    ]);
    const past = new Date(Date.now() - 169 * 3600_000);
    const recent = new Date(Date.now() - 1 * 3600_000);
    const tieTime = new Date(Date.now() - 20 * 3600_000);
    [{ id: fixtureCollectionId }] = await tx.insert(collections).values({ ownerId: owner, displayName: "BUILD-05 fixture collection" }).returning({ id: collections.id });
    [{ id: fixtureTagId }] = await tx.insert(tags).values({ ownerId: owner, displayName: "BUILD-05 fixture tag" }).returning({ id: tags.id });
    const inserted = await tx.insert(notes).values([
      { ownerId: owner, title: "expired", body: "xx", deletedAt: past, purgeAfter: new Date(past.getTime() + 168 * 3600_000) },
      { ownerId: owner, title: "expired-empty", body: "", deletedAt: past, purgeAfter: new Date(past.getTime() + 168 * 3600_000) },
      { ownerId: owner, title: "recent", body: "", deletedAt: recent, purgeAfter: new Date(recent.getTime() + 168 * 3600_000) },
      { ownerId: other, title: "foreign", body: "z" },
      { ownerId: owner, title: "tie-a", deletedAt: tieTime, purgeAfter: new Date(tieTime.getTime() + 168 * 3600_000), collectionId: fixtureCollectionId },
      { ownerId: owner, title: "tie-b", deletedAt: tieTime, purgeAfter: new Date(tieTime.getTime() + 168 * 3600_000) },
      ...Array.from({ length: 52 }, (_, index) => ({ ownerId: owner, title: `page-${index}`, deletedAt: tieTime, purgeAfter: new Date(tieTime.getTime() + 168 * 3600_000) })),
    ]).returning({ id: notes.id });
    fixtureNoteIds = inserted.map((n) => n.id);
  });
  await runTransaction(url, async (tx) => {
    const data = await openOwnedData(tx, owner);
    await assert.rejects(data.getNote(fixtureNoteIds[3]), (error: unknown) => error instanceof Error && "code" in error && error.code === "NOT_FOUND");
    const firstPage = await data.listTrash();
    assert.equal(firstPage.items.length, 50);
    assert.ok(firstPage.nextCursor);
    const secondPage = await data.listTrash(firstPage.nextCursor!);
    assert.equal(firstPage.items.length + secondPage.items.length, 57);
    assert.equal(new Set([...firstPage.items, ...secondPage.items].map(({ id }) => id)).size, 57);
    await assert.rejects(data.getNote(fixtureNoteIds[0]), (error: unknown) => error instanceof Error && "code" in error && error.code === "NOT_FOUND");
    const expired = await tx.select({ deletedAt: notes.deletedAt, purgeAfter: notes.purgeAfter }).from(notes).where(eq(notes.id, fixtureNoteIds[0]));
    assert.ok(expired[0].deletedAt && expired[0].purgeAfter);
    assert.equal(expired[0].purgeAfter!.getTime() - expired[0].deletedAt!.getTime(), 168 * 3600_000);
    const otherData = await openOwnedData(tx, other);
    assert.equal((await otherData.getNote(fixtureNoteIds[3])).title, "foreign");
    assert.equal((await otherData.listTrash()).items.length, 0);
    await assert.rejects(data.listTrash({ id: fixtureNoteIds[3], deletedAt: "not-a-date" }));
  });
  const foreignMutationId = randomUUID(); fixtureMutationIds.add(foreignMutationId);
  await assert.rejects(runTransaction(url, (tx) => lifecycle(tx, owner, fixtureNoteIds[3], "trash", 1, foreignMutationId)), (error: unknown) => error instanceof Error && "code" in error && error.code === "NOT_FOUND");
  await runTransaction(url, async (tx) => {
    [{ id: lifecycleNoteId }] = await tx.insert(notes).values({ ownerId: owner, title: "lifecycle", body: "keep", collectionId: fixtureCollectionId }).returning({ id: notes.id });
  });
  const trashMutationId = randomUUID(); fixtureMutationIds.add(trashMutationId);
  const trashed = await runTransaction(url, (tx) => lifecycle(tx, owner, lifecycleNoteId, "trash", 1, trashMutationId));
  assert.equal(trashed.revision, 2);
  assert.equal(trashed.purgeAfter!.getTime() - trashed.deletedAt!.getTime(), 168 * 3600_000);
  await runTransaction(url, async (tx) => {
    const [account] = await tx.select({ used: quotaUsage.used }).from(quotaUsage).where(and(eq(quotaUsage.ownerId, owner), eq(quotaUsage.metric, "notes_count"), eq(quotaUsage.windowStart, storageWindow)));
    const [global] = await tx.select({ used: globalQuotaUsage.used }).from(globalQuotaUsage).where(and(eq(globalQuotaUsage.metric, "notes_count"), eq(globalQuotaUsage.windowStart, storageWindow)));
    assert.equal(account?.used ?? 0, 0); assert.equal(global?.used ?? 0, 0);
  });
  const replayed = await runTransaction(url, (tx) => lifecycle(tx, owner, lifecycleNoteId, "trash", 1, trashMutationId));
  assert.equal(replayed.replayed, true);
  const staleId = randomUUID(); fixtureMutationIds.add(staleId);
  await assert.rejects(runTransaction(url, (tx) => lifecycle(tx, owner, lifecycleNoteId, "restore", 1, staleId)), /revision conflict/);
  const expiryId = randomUUID(); fixtureMutationIds.add(expiryId);
  const restoreId = randomUUID(); fixtureMutationIds.add(restoreId);
  const restored = await runTransaction(url, (tx) => lifecycle(tx, owner, lifecycleNoteId, "restore", 2, restoreId));
  assert.equal(restored.revision, 3);
  const afterRestoreReplay = await runTransaction(url, (tx) => lifecycle(tx, owner, lifecycleNoteId, "trash", 1, trashMutationId));
  assert.equal(afterRestoreReplay.replayed, true);
  await runTransaction(url, async (tx) => {
    await tx.execute(sql`update notes set deleted_at = now() - interval '168 hours', purge_after = now(), revision = revision + 1, updated_at = clock_timestamp() where id = ${lifecycleNoteId} and owner_id = ${owner}`);
  });
  await assert.rejects(runTransaction(url, (tx) => lifecycle(tx, owner, lifecycleNoteId, "restore", 4, expiryId)), (error: unknown) => error instanceof MutationError && error.code === "EXPIRED");
  await runTransaction(url, async (tx) => {
    await tx.update(notes).set({ deletedAt: null, purgeAfter: null, revision: sql`${notes.revision} + 1` }).where(eq(notes.id, lifecycleNoteId));
  });
  await runTransaction(url, async (tx) => {
    const data = await openOwnedData(tx, owner);
    assert.equal((await data.getNote(lifecycleNoteId)).body, "keep");
    const [note] = await tx.select({ collectionId: notes.collectionId }).from(notes).where(eq(notes.id, lifecycleNoteId));
    assert.equal(note.collectionId, fixtureCollectionId);
  });
  const saveRaceId = randomUUID(); fixtureMutationIds.add(saveRaceId);
  const trashRaceId = randomUUID(); fixtureMutationIds.add(trashRaceId);
  const [saveOutcome, trashOutcome] = await Promise.allSettled([
    runTransaction(url, (tx) => saveMutation(tx, owner, lifecycleNoteId, 5, "keep!", saveRaceId)),
    runTransaction(url, (tx) => lifecycle(tx, owner, lifecycleNoteId, "trash", 5, trashRaceId)),
  ]);
  assert.notEqual(saveOutcome.status, trashOutcome.status);
  const expectedBytesAfterSaveRace = saveOutcome.status === "fulfilled" ? 7 : 6;
  await runTransaction(url, async (tx) => {
    const [note] = await tx.select({ body: notes.body, deletedAt: notes.deletedAt, revision: notes.revision }).from(notes).where(and(eq(notes.ownerId, owner), eq(notes.id, lifecycleNoteId)));
    assert.equal(note.revision, 6);
    if (note.deletedAt) assert.equal(note.body, "keep");
    else assert.equal(note.body, "keep!");
  });
  const beforeGlobal = await runTransaction(url, async (tx) => tx.select().from(globalQuotaUsage).where(eq(globalQuotaUsage.windowStart, epoch)));
  const first = await purgeExpiredNotes(1);
  assert.equal(first.purgedCount, 1);
  assert.equal(first.remainingExpired, true);
  await assert.rejects(runTransaction(url, async (tx) => {
    const [row] = await tx.select({ used: quotaUsage.used }).from(quotaUsage).where(and(eq(quotaUsage.ownerId, owner), eq(quotaUsage.metric, "notes_count"), eq(quotaUsage.windowStart, epoch)));
    assert.equal(row.used, 2);
    throw new Error("ROLLBACK_PROBE");
  }), /ROLLBACK_PROBE/);
  const second = await purgeExpiredNotes(10);
  assert.equal(second.purgedCount, 1);
  assert.equal(second.remainingExpired, false);
  const replay = await purgeExpiredNotes(10);
  assert.equal(replay.purgedCount, 0);
  assert.equal(replay.remainingExpired, false);
  await runTransaction(url, async (tx) => {
    const remaining = await tx.select().from(notes).where(eq(notes.ownerId, owner));
    assert.equal(remaining.length, 56);
    assert.ok(remaining.some((note) => note.title === "recent"));
    const account = await tx.select().from(quotaUsage).where(and(eq(quotaUsage.ownerId, owner), eq(quotaUsage.windowStart, epoch)));
    assert.equal(account.find((r) => r.metric === "notes_count")?.used, 1);
    assert.equal(account.find((r) => r.metric === "notes_bytes")?.used, expectedBytesAfterSaveRace);
    const afterGlobal = await tx.select().from(globalQuotaUsage).where(eq(globalQuotaUsage.windowStart, epoch));
    assert.equal(afterGlobal.find((r) => r.metric === "notes_count")?.used, beforeGlobal.find((r) => r.metric === "notes_count")!.used - 2);
    assert.equal(afterGlobal.find((r) => r.metric === "notes_bytes")?.used, beforeGlobal.find((r) => r.metric === "notes_bytes")!.used - 22);
    const foreign = await tx.select({ id: notes.id }).from(notes).where(eq(notes.ownerId, other));
    assert.deepEqual(foreign, [{ id: fixtureNoteIds[3] }]);
  });
  let racePurgeNoteId = "";
  const raceTime = new Date(Date.now() - 169 * 3600_000);
  await runTransaction(url, async (tx) => {
    [{ id: racePurgeNoteId }] = await tx.insert(notes).values({ ownerId: owner, title: "", body: "x", deletedAt: raceTime, purgeAfter: new Date(raceTime.getTime() + 168 * 3600_000) }).returning({ id: notes.id });
    fixtureNoteIds.push(racePurgeNoteId);
    await tx.update(quotaUsage).set({ used: sql`${quotaUsage.used} + 1` }).where(and(eq(quotaUsage.ownerId, owner), eq(quotaUsage.metric, "notes_count"), eq(quotaUsage.windowStart, epoch)));
    await tx.update(quotaUsage).set({ used: sql`${quotaUsage.used} + 1` }).where(and(eq(quotaUsage.ownerId, owner), eq(quotaUsage.metric, "notes_bytes"), eq(quotaUsage.windowStart, epoch)));
    await tx.update(globalQuotaUsage).set({ used: sql`${globalQuotaUsage.used} + 1` }).where(and(eq(globalQuotaUsage.metric, "notes_count"), eq(globalQuotaUsage.windowStart, epoch)));
    await tx.update(globalQuotaUsage).set({ used: sql`${globalQuotaUsage.used} + 1` }).where(and(eq(globalQuotaUsage.metric, "notes_bytes"), eq(globalQuotaUsage.windowStart, epoch)));
  });
  const restoreRaceId = randomUUID(); fixtureMutationIds.add(restoreRaceId);
  const [racePurgeOutcome, restoreRaceOutcome] = await Promise.allSettled([
    purgeExpiredNotes(10),
    runTransaction(url, (tx) => lifecycle(tx, owner, racePurgeNoteId, "restore", 1, restoreRaceId)),
  ]);
  assert.equal(racePurgeOutcome.status, "fulfilled");
  assert.deepEqual(racePurgeOutcome.status === "fulfilled" ? racePurgeOutcome.value : null, { purgedCount: 1, remainingExpired: false });
  assert.equal(restoreRaceOutcome.status, "rejected");
  assert.ok(restoreRaceOutcome.status === "rejected" && restoreRaceOutcome.reason instanceof Error && "code" in restoreRaceOutcome.reason && ["NOT_FOUND", "EXPIRED"].includes(String(restoreRaceOutcome.reason.code)));
  await runTransaction(url, async (tx) => {
    assert.equal((await tx.select({ id: notes.id }).from(notes).where(eq(notes.id, racePurgeNoteId))).length, 0);
    const account = await tx.select().from(quotaUsage).where(and(eq(quotaUsage.ownerId, owner), eq(quotaUsage.windowStart, epoch)));
    assert.equal(account.find((r) => r.metric === "notes_count")?.used, 1);
    assert.equal(account.find((r) => r.metric === "notes_bytes")?.used, expectedBytesAfterSaveRace);
  });
  console.log("PASS: expired notes purge in bounded batches; recent Trash remains; repeated purge is idempotent.");
  console.log("PASS: owner isolation, foreign mutation denial, tied cursor pagination, invalid cursors, quota-neutral Trash/restore, receipt replay, revision conflict, expiry, restored content/collection, save/Trash race and concurrent restore/purge.");
} finally {
  await runTransaction(url, async (tx) => {
    const fixtures = await tx.select({ id: appUsers.id }).from(appUsers).where(eq(appUsers.authIssuer, issuer));
    if (!fixtures.length) return;
    assert.equal(fixtures.length, 2);
    const owners = [owner, other];
    await tx.delete(mutationReceipts).where(inArray(mutationReceipts.mutationId, [...fixtureMutationIds]));
    const lockedGlobals = await tx.select().from(globalQuotaUsage).for("update");
    for (const row of lockedGlobals) {
      const usage = await tx.execute<{ used: number }>(sql`select coalesce(sum(used), 0)::int as used from quota_usage where owner_id in (${owner}, ${other}) and metric = ${row.metric} and window_start = ${row.windowStart}`);
      assert.ok(row.used >= usage.rows[0].used);
      await tx.update(globalQuotaUsage).set({ used: sql`${globalQuotaUsage.used} - ${usage.rows[0].used}` }).where(and(eq(globalQuotaUsage.metric, row.metric), eq(globalQuotaUsage.windowStart, row.windowStart)));
    }
    await tx.delete(quotaUsage).where(inArray(quotaUsage.ownerId, owners));
    await tx.delete(notes).where(inArray(notes.id, fixtureNoteIds.concat(lifecycleNoteId).filter(Boolean)));
    if (fixtureCollectionId) await tx.delete(collections).where(eq(collections.id, fixtureCollectionId));
    if (fixtureTagId) await tx.delete(tags).where(eq(tags.id, fixtureTagId));
    await tx.delete(globalQuotaUsage).where(eq(globalQuotaUsage.used, 0));
    await tx.delete(appUsers).where(and(eq(appUsers.authIssuer, issuer), inArray(appUsers.id, owners)));
  });
  await runTransaction(url, async (tx) => {
    assert.equal((await tx.select({ id: appUsers.id }).from(appUsers).where(eq(appUsers.authIssuer, issuer))).length, 0);
    assert.equal((await tx.select({ id: notes.id }).from(notes).where(inArray(notes.ownerId, [owner, other]))).length, 0);
    assert.equal((await tx.select().from(quotaUsage).where(inArray(quotaUsage.ownerId, [owner, other]))).length, 0);
    assert.equal((await tx.select().from(mutationReceipts).where(inArray(mutationReceipts.mutationId, [...fixtureMutationIds]))).length, 0);
  });
  console.log("Synthetic BUILD-05 identity, notes and counters removed and verified.");
}
