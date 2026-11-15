import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { eq } from "drizzle-orm";

import { DataAccessError, openOwnedData } from "../src/lib/db/owned-data.ts";
import { appUsers, collections, noteReferences, notes, noteTags, references, referenceTags, tags } from "../src/lib/db/schema.ts";
import { runTransaction } from "../src/lib/db/transaction-session.ts";

nextEnv.loadEnvConfig(process.cwd());
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required. Use your development environment.");

const fixtureIssuer = `urn:cosmiccore:ownership-check:${randomUUID()}`;
const rollback = new Error("Rollback all ownership fixtures");
const hasCode = (code: DataAccessError["code"]) => (error: unknown) =>
  error instanceof DataAccessError && error.code === code;
const isForeignKeyError = (error: unknown) => {
  const cause = error instanceof Error ? error.cause : undefined;
  return typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23503";
};

try {
  await assert.rejects(runTransaction(databaseUrl, async (tx) => {
    const a = randomUUID();
    const b = randomUUID();
    const blocked = randomUUID();
    const pending = randomUUID();
    await tx.insert(appUsers).values([
      { id: a, status: "active" }, { id: b, status: "active" },
      { id: blocked, status: "blocked" }, { id: pending, status: "deletion_pending" },
    ].map((user) => ({ ...user, authIssuer: fixtureIssuer, authSubject: user.id, email: "ownership-check@example.invalid" })));

    const [collectionA, collectionB] = await tx.insert(collections).values([
      { ownerId: a, displayName: "Collection" }, { ownerId: b, displayName: "Collection" },
    ]).returning();
    const [tagA, tagB] = await tx.insert(tags).values([
      { ownerId: a, displayName: "Tag" }, { ownerId: b, displayName: "Tag" },
    ]).returning();
    const deletedAt = new Date();
    const [noteA, noteB, trashed] = await tx.insert(notes).values([
      { ownerId: a, title: "A", body: "Synthetic A", collectionId: collectionA.id },
      { ownerId: b, title: "B", body: "Synthetic B", collectionId: collectionB.id },
      { ownerId: a, title: "Trash", deletedAt, purgeAfter: new Date(deletedAt.getTime() + 168 * 3600_000) },
    ]).returning();
    const [referenceA, referenceB] = await tx.insert(references).values([
      { ownerId: a, title: "A", url: "https://example.invalid/", canonicalUrlKey: "https://example.invalid/" },
      { ownerId: b, title: "B", url: "https://example.invalid/", canonicalUrlKey: "https://example.invalid/" },
    ]).returning();

    const ownedA = await openOwnedData(tx, a);
    const ownedB = await openOwnedData(tx, b);
    assert.equal((await ownedA.getNote(noteA.id)).body, "Synthetic A");
    assert.equal((await ownedB.getNote(noteB.id)).body, "Synthetic B");
    assert.equal((await ownedA.getReference(referenceA.id)).id, referenceA.id);
    assert.equal((await ownedB.getReference(referenceB.id)).id, referenceB.id);
    assert.equal((await ownedA.getCollection(collectionA.id)).id, collectionA.id);
    assert.equal((await ownedA.getTag(tagA.id)).id, tagA.id);

    for (const [getter, foreignId] of [
      [ownedA.getNote, noteB.id], [ownedA.getReference, referenceB.id],
      [ownedA.getCollection, collectionB.id], [ownedA.getTag, tagB.id],
      [ownedB.getNote, noteA.id], [ownedB.getReference, referenceA.id],
      [ownedB.getCollection, collectionA.id], [ownedB.getTag, tagA.id],
    ] as const) {
      await assert.rejects(() => getter(foreignId), hasCode("NOT_FOUND"));
      await assert.rejects(() => getter(randomUUID()), hasCode("NOT_FOUND"));
      await assert.rejects(() => getter("invalid"), hasCode("VALIDATION"));
    }
    await assert.rejects(() => ownedA.getNote(trashed.id), hasCode("NOT_FOUND"));
    console.log("PASS: both owners read their own resources; foreign/missing/trashed records stay hidden.");

    await ownedA.assertAssociations(collectionA.id, [tagA.id]);
    await ownedA.assertAssociations(null, []);
    await assert.rejects(() => ownedA.assertAssociations(collectionB.id, []), hasCode("NOT_FOUND"));
    await assert.rejects(() => ownedA.assertAssociations(null, [tagB.id]), hasCode("NOT_FOUND"));
    await assert.rejects(() => ownedA.assertAssociations(null, [tagA.id, tagA.id.toUpperCase()]), hasCode("VALIDATION"));
    await assert.rejects(() => ownedA.assertAssociations(null, Array.from({ length: 21 }, () => randomUUID())), hasCode("VALIDATION"));

    // Savepoints let each expected constraint error roll back independently.
    for (const invalidInsert of [
      (nested: typeof tx) => nested.insert(notes).values({ ownerId: a, collectionId: collectionB.id }),
      (nested: typeof tx) => nested.insert(references).values({ ownerId: a, title: "Bad", url: "https://example.invalid/bad", canonicalUrlKey: "https://example.invalid/bad", collectionId: collectionB.id }),
      (nested: typeof tx) => nested.insert(noteTags).values({ ownerId: a, noteId: noteA.id, tagId: tagB.id }),
      (nested: typeof tx) => nested.insert(referenceTags).values({ ownerId: a, referenceId: referenceA.id, tagId: tagB.id }),
      (nested: typeof tx) => nested.insert(noteReferences).values({ ownerId: a, noteId: noteA.id, referenceId: referenceB.id }),
    ]) {
      await assert.rejects(tx.transaction(async (nested) => { await invalidInsert(nested); }), isForeignKeyError);
    }
    console.log("PASS: association checks and database constraints reject cross-owner links.");

    for (const id of [blocked, pending, randomUUID()]) {
      await assert.rejects(() => openOwnedData(tx, id), hasCode("ACCOUNT_UNAVAILABLE"));
    }
    // Simulate a previously active identity becoming blocked before a new access.
    await tx.update(appUsers).set({ status: "blocked" }).where(eq(appUsers.id, a));
    await assert.rejects(() => openOwnedData(tx, a), hasCode("ACCOUNT_UNAVAILABLE"));
    console.log("PASS: blocked, deletion-pending, missing and newly blocked accounts are denied.");
    throw rollback;
  }), (error) => error === rollback);

  await runTransaction(databaseUrl, async (tx) => {
    const leftovers = await tx.select({ id: appUsers.id }).from(appUsers).where(eq(appUsers.authIssuer, fixtureIssuer));
    assert.equal(leftovers.length, 0);
  });
  console.log("Ownership checks passed. All synthetic fixtures were rolled back.");
} catch {
  console.error("Ownership check failed. Check your development connection and migrations; do not share credentials.");
  process.exitCode = 1;
}
