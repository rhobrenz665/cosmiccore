import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import { sql } from "drizzle-orm";

import { appUsers } from "../src/lib/db/schema.ts";
import { runTransaction } from "../src/lib/db/transaction-session.ts";

import { reserveNoteAnswer } from "../src/lib/ai/note-answer-quota.ts";

const database = process.env.COSMICCORE_TEST_DATABASE_URL;
if (!database || process.env.COSMICCORE_TEST_PROJECT_ID !== "lingering-fire-94844546") throw new Error("Use the isolated acceptance configuration.");
const target = new URL(database);
if (target.hostname !== "ep-rough-pond-azt24vit-pooler.c-3.ap-southeast-1.aws.neon.tech" || target.pathname !== "/cosmiccore_dev") {
  throw new Error("Unexpected acceptance database.");
}


const migration = readFileSync(new URL("../drizzle/0005_note_answer_quota.sql", import.meta.url), "utf8");
const rollback = new Error("Roll back quota test");
try {
  await runTransaction(database, async tx => {
    for (const statement of migration.split("--> statement-breakpoint")) await tx.execute(sql.raw(statement));
    await tx.execute(sql`delete from global_quota_usage where metric = 'note_answers_count'`);
    const [owner] = await tx.insert(appUsers).values({
      authIssuer: `synthetic-quota-${randomUUID()}`, authSubject: "owner", email: "",
    }).returning({ id: appUsers.id });
    assert.equal(await reserveNoteAnswer(tx, owner.id), true);
    assert.equal(await reserveNoteAnswer(tx, owner.id), false);
    await tx.execute(sql`update global_quota_usage set updated_at = clock_timestamp() - interval '2 minutes'
      where metric = 'note_answers_count'`);
    await tx.execute(sql`update quota_usage set used = 5 where metric = 'note_answers_count' and owner_id = ${owner.id}`);
    assert.equal(await reserveNoteAnswer(tx, owner.id), false);
    await tx.execute(sql`update quota_usage set used = 1 where metric = 'note_answers_count' and owner_id = ${owner.id}`);
    await tx.execute(sql`update global_quota_usage set used = 24 where metric = 'note_answers_count'`);
    assert.equal(await reserveNoteAnswer(tx, owner.id), false);
    throw rollback;
  });
} catch (error) {
  if (error !== rollback) throw error;
  console.log("PASS quota migration, reservation, cooldown, and daily caps");
}
