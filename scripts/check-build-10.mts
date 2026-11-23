import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import { eq, sql } from "drizzle-orm";

import { appUsers, notes, references, retrievalVersions } from "../src/lib/db/schema.ts";
import { runTransaction } from "../src/lib/db/transaction-session.ts";
import { indexSource } from "../src/lib/retrieval/index-core.ts";
import { retrieveSources } from "../src/lib/retrieval/search-core.ts";

const database = process.env.COSMICCORE_TEST_DATABASE_URL;
if (!database || process.env.COSMICCORE_TEST_PROJECT_ID !== "lingering-fire-94844546") throw new Error("Use the isolated acceptance configuration.");
const target = new URL(database);
if (target.hostname !== "ep-rough-pond-azt24vit-pooler.c-3.ap-southeast-1.aws.neon.tech" || target.pathname !== "/cosmiccore_dev") {
  throw new Error("Unexpected acceptance database.");
}

const migration = readFileSync(new URL("../drizzle/0004_retrieval_storage.sql", import.meta.url), "utf8");
const rollback = new Error("Acceptance verified; roll back fixtures and migration.");
try {
  await runTransaction(database, async tx => {
    for (const statement of migration.split("--> statement-breakpoint")) await tx.execute(sql.raw(statement));
    const issuer = `synthetic-retrieval-${randomUUID()}`;
    const [owner, other] = await tx.insert(appUsers).values([
      { authIssuer: issuer, authSubject: "owner", email: "" },
      { authIssuer: issuer, authSubject: "other", email: "" },
    ]).returning({ id: appUsers.id });
    const [note, foreign] = await tx.insert(notes).values([
      { ownerId: owner.id, title: "Planet", body: "# Orbit\nPlanet observations" },
      { ownerId: other.id, title: "Planet", body: "Planet private observation" },
    ]).returning({ id: notes.id });
    const [reference] = await tx.insert(references).values({
      ownerId: owner.id, title: "Planet guide", description: "Planet reference notes",
      url: "https://example.com/guide", canonicalUrlKey: "https://example.com/guide",
    }).returning({ id: references.id });

    assert.deepEqual(await retrieveSources(tx, owner.id, "planet"), []);
    await assert.rejects(indexSource(tx, owner.id, { kind: "note", id: foreign.id }), { code: "NOT_FOUND" });
    await indexSource(tx, owner.id, { kind: "note", id: note.id });
    await indexSource(tx, owner.id, { kind: "note", id: note.id });
    await indexSource(tx, other.id, { kind: "note", id: foreign.id });
    await indexSource(tx, owner.id, { kind: "reference", id: reference.id });
    const matches = await retrieveSources(tx, owner.id, "planet");
    assert.deepEqual(new Set(matches.map(match => match.sourceId)), new Set([note.id, reference.id]));
    assert.equal(matches.length, 2);
    assert.equal(matches.find(match => match.kind === "note")?.heading, "Orbit");
    assert.equal(matches[0].revision, 1);

    await tx.update(notes).set({ revision: 2, body: "New moon observations" }).where(eq(notes.id, note.id));
    assert.equal((await retrieveSources(tx, owner.id, "planet")).length, 1);
    await indexSource(tx, owner.id, { kind: "note", id: note.id });
    assert.equal((await retrieveSources(tx, owner.id, "moon"))[0].revision, 2);
    await tx.update(notes).set({
      deletedAt: sql`now()`, purgeAfter: sql`now() + interval '168 hours'`, revision: 3,
    }).where(eq(notes.id, note.id));
    assert.deepEqual(await retrieveSources(tx, owner.id, "moon"), []);
    await assert.rejects(indexSource(tx, owner.id, { kind: "note", id: note.id }), { code: "NOT_FOUND" });
    await tx.update(notes).set({ deletedAt: null, purgeAfter: null, revision: 4 }).where(eq(notes.id, note.id));
    assert.deepEqual(await retrieveSources(tx, owner.id, "moon"), []);
    await indexSource(tx, owner.id, { kind: "note", id: note.id });
    assert.equal((await retrieveSources(tx, owner.id, "moon"))[0].revision, 4);
    await tx.delete(references).where(eq(references.id, reference.id));
    assert.deepEqual(await tx.select().from(retrievalVersions).where(eq(retrievalVersions.referenceId, reference.id)), []);
    await tx.update(appUsers).set({ status: "deletion_pending" }).where(eq(appUsers.id, owner.id));
    await assert.rejects(retrieveSources(tx, owner.id, "planet"), { code: "ACCOUNT_UNAVAILABLE" });
    throw rollback;
  });
  assert.fail("Acceptance unexpectedly committed.");
} catch (error) {
  if (error !== rollback) throw error;
  console.log("BUILD-10 owner isolation, revision, Trash/restore, deletion cascade, and rollback checks passed.");
}
