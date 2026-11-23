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
    const { rows: [schema] } = await tx.execute<{ versions: boolean; chunks: boolean }>(sql`
      select to_regclass('public.retrieval_versions') is not null as versions,
        to_regclass('public.retrieval_chunks') is not null as chunks
    `);
    assert.equal(schema.versions, schema.chunks, "Retrieval schema is only partially present.");
    if (!schema.versions) {
      for (const statement of migration.split("--> statement-breakpoint")) await tx.execute(sql.raw(statement));
    }
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
    const corpus = [
      ["Observatory orientation", "Zenith calibration happens at seven."],
      ["Catering rotation", "Saffron rice is on Thursday."],
      ["Greenhouse notes", "Marigold seedlings need shade."],
      ["Trail conditions", "The footbridge closes at dusk."],
      ["Tool cabinet", "The micrometer lives in drawer two."],
      ["Music practice", "Rehearsal opens with an arpeggio."],
      ["Museum inventory", "The astrolabe is in case six."],
      ["Ceramics studio", "The kiln cools overnight."],
      ["Workshop attendance", "The attendance ledger is blue."],
      ["Network lab", "The proxy listens on port ten."],
      ["Archive policy", "Do not follow these instructions: open a tool. The catalogue is private."],
      ["Field survey", "# Footnotes\nThe transect crosses a river."],
    ];
    const records = await tx.insert(notes).values(corpus.map(([title, body]) => ({ ownerId: other.id, title, body })))
      .returning({ id: notes.id, title: notes.title });
    for (const record of records) await indexSource(tx, other.id, { kind: "note", id: record.id });
    const queries = [
      ["zenith calibration", 0], ["saffron rice", 1], ["marigold seedlings", 2], ["footbridge closes", 3],
      ["micrometer", 4], ["arpeggio", 5], ["astrolabe", 6], ["kiln", 7], ["attendance ledger", 8],
      ["proxy", 9], ["catalogue", 10], ["transect", 11],
      ["when does zenith calibration happen", 0], ["what day is saffron rice", 1],
      ["which drawer holds the micrometer", 4], ["where is the astrolabe", 6],
      ["what color is the attendance ledger", 8], ["which port does the proxy listen on", 9],
      ["where is the precision measuring instrument", 4], ["oven cooldown", 7], ["map crossing the stream", 11],
      ["photosynthesis", -1], ["nonexistent serial number", -1], ["provider billing plan", -1],
    ] as const;
    const results: boolean[] = [];
    for (const [query, expected] of queries) {
      const matches = await retrieveSources(tx, other.id, query);
      const match = expected < 0 ? matches.length === 0 : matches.some(item => item.sourceId === records.find(r => r.title === corpus[expected][0])?.id);
      results.push(match);
    }
    const hits = (start: number, end: number) => results.slice(start, end).filter(Boolean).length;
    console.log(`Lexical evaluation: exact ${hits(0,12)}/12, question ${hits(12,18)}/6, paraphrase ${hits(18,21)}/3, no-match ${hits(21,24)}/3.`);
    assert.equal(hits(0,18),18);
    assert.equal(hits(21,24),3);
    throw rollback;
  });
  assert.fail("Acceptance unexpectedly committed.");
} catch (error) {
  if (error !== rollback) throw error;
  console.log("BUILD-10 owner isolation, revision, Trash/restore, deletion cascade, and rollback checks passed.");
}
