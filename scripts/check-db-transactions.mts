import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { sql } from "drizzle-orm";

import { runTransaction } from "../src/lib/db/transaction-session.ts";

nextEnv.loadEnvConfig(process.cwd());
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required. Load your development environment first.");

// Use only on the development database. Successful work uses a temporary table;
// synthetic app_users inserts below are deliberately rolled back, never committed.
const subject = randomUUID();
const issuer = "urn:cosmiccore:transaction-check";
const deliberateFailure = new Error("Deliberate rollback check");

try {
  const committed = await runTransaction(databaseUrl, async (tx) => {
    await tx.execute(sql`create temporary table cosmiccore_transaction_check (value integer not null) on commit drop`);
    await tx.execute(sql`insert into cosmiccore_transaction_check (value) values (1)`);
    const result = await tx.execute<{ value: number }>(sql`select value from cosmiccore_transaction_check`);
    assert.equal(result.rows[0]?.value, 1);
    return "committed";
  });
  assert.equal(committed, "committed");
  console.log("PASS: interactive transaction commits and returns its result.");

  await assert.rejects(runTransaction(databaseUrl, async (tx) => {
    await tx.execute(sql`insert into app_users (auth_issuer, auth_subject, email)
      values (${issuer}, ${subject}, 'transaction-check@example.invalid')`);
    throw deliberateFailure;
  }), (error) => error === deliberateFailure);

  // Only this unique synthetic identity is queried; no real account data is read.
  await runTransaction(databaseUrl, async (tx) => {
    const result = await tx.execute<{ count: number }>(sql`select count(*)::integer as count from app_users
      where auth_issuer = ${issuer} and auth_subject = ${subject}`);
    assert.equal(result.rows[0]?.count, 0);
  });
  console.log("PASS: callback failure rolls back the synthetic account insert.");

  await assert.rejects(runTransaction(databaseUrl, async (tx) => {
    await tx.execute(sql`insert into app_users (auth_issuer, auth_subject, email)
      values (${issuer}, ${subject}, 'transaction-check@example.invalid')`);
    await tx.execute(sql`select 1 / 0`);
  }), (error) => {
    const cause = error instanceof Error ? error.cause : undefined;
    return typeof cause === "object" && cause !== null && "code" in cause && cause.code === "22012";
  });

  await runTransaction(databaseUrl, async (tx) => {
    const result = await tx.execute<{ count: number }>(sql`select count(*)::integer as count from app_users
      where auth_issuer = ${issuer} and auth_subject = ${subject}`);
    assert.equal(result.rows[0]?.count, 0);
  });
  console.log("PASS: SQL failure rolls back; a fresh transaction succeeds afterward.");
  console.log("Transaction checks passed. No permanent test records were committed.");
} catch {
  // Driver errors can contain connection details or SQL parameters.
  console.error("Transaction check failed. Check development connectivity, Node version and applied migrations; do not share credentials.");
  process.exitCode = 1;
}
