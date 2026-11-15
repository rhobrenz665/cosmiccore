import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { and, eq, inArray, sql } from "drizzle-orm";
import { appUsers, globalQuotaUsage, mutationReceipts, notes, quotaUsage } from "../src/lib/db/schema.ts";
import { runTransaction } from "../src/lib/db/transaction-session.ts";

const runId = process.argv[2];
if (!runId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(runId) || process.argv.length !== 3) {
  throw new Error("Usage: npm run db:cleanup-acceptance -- <interrupted-run-id>");
}
nextEnv.loadEnvConfig(process.cwd());
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required. Use development only.");
const issuer = `urn:cosmiccore:acceptance-check:${runId.toLowerCase()}`;
const legacyRun = "88627e26-4475-44c0-9e67-8961998e0b54";
const metrics = ["notes_count", "notes_bytes", "mutations_count"] as const;
console.log(`Development acceptance recovery: ${runId}`);
try {
  await runTransaction(url, async (tx) => {
    const identities = await tx.select().from(appUsers).where(eq(appUsers.authIssuer, issuer));
    // Missing/partial fixtures need review. Do not guess global-row ownership.
    assert.equal(identities.length, 8);
    for (const row of identities) {
      assert.equal(row.email, "acceptance@example.invalid");
      assert.equal(row.authSubject, row.id);
    }
    const ownerIds = identities.map((row) => row.id).sort();
    for (const owner of ownerIds) {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`cosmiccore:mutation:${owner}`}, 0))`);
    }
    await tx.select({ id: appUsers.id }).from(appUsers).where(eq(appUsers.authIssuer, issuer)).for("update");
    let base: number;
    const markers = new Set(identities.map((row) => row.displayName));
    const [marker] = markers;
    if (markers.size === 1 && marker?.startsWith("acceptance-window:")) {
      base = Date.parse(marker.slice("acceptance-window:".length));
    } else {
      // This one legacy run predates the persisted marker. The owner supplied
      // all seven early PASS lines, proving the first window was committed.
      assert.equal(runId.toLowerCase(), legacyRun);
      const rows = await tx.select({ window: quotaUsage.windowStart }).from(quotaUsage).where(inArray(quotaUsage.ownerId, ownerIds));
      assert.ok(rows.length > 0);
      base = Math.min(...rows.map((row) => row.window.getTime()));
    }
    assert.ok(Number.isFinite(base) && base >= Date.UTC(2100, 0, 1) && base % 60_000 === 0);
    const windows = Array.from({ length: 8 }, (_, index) => new Date(base + index * 60_000));
    const globals = await tx.select().from(globalQuotaUsage).where(inArray(globalQuotaUsage.windowStart, windows))
      .orderBy(globalQuotaUsage.metric, globalQuotaUsage.windowStart).for("update");
    assert.equal(globals.length, 24);
    // Include every account in these exact future windows, so collisions with
    // another test cannot be silently removed. No private content is selected.
    const account = await tx.select().from(quotaUsage).where(inArray(quotaUsage.windowStart, windows));
    for (const row of account) {
      assert.ok(ownerIds.includes(row.ownerId));
      assert.ok((metrics as readonly string[]).includes(row.metric));
    }
    const ownedAccount = await tx.select().from(quotaUsage).where(inArray(quotaUsage.ownerId, ownerIds));
    assert.equal(ownedAccount.length, account.length);
    for (const row of globals) {
      assert.ok((metrics as readonly string[]).includes(row.metric));
      const sum = account.filter((item) => item.metric === row.metric && item.windowStart.getTime() === row.windowStart.getTime())
        .reduce((used, item) => used + item.used, 0);
      assert.ok(Number.isSafeInteger(sum));
      assert.equal(row.used, sum);
    }
    await tx.delete(appUsers).where(and(eq(appUsers.authIssuer, issuer), inArray(appUsers.id, ownerIds)));
    await tx.delete(globalQuotaUsage).where(and(inArray(globalQuotaUsage.metric, metrics), inArray(globalQuotaUsage.windowStart, windows)));
    assert.equal((await tx.select({ id: appUsers.id }).from(appUsers).where(eq(appUsers.authIssuer, issuer))).length, 0);
    for (const table of [notes, mutationReceipts, quotaUsage]) {
      assert.equal((await tx.select().from(table).where(inArray(table.ownerId, ownerIds))).length, 0);
    }
    assert.equal((await tx.select().from(globalQuotaUsage).where(inArray(globalQuotaUsage.windowStart, windows))).length, 0);
  });
  console.log("Interrupted acceptance fixtures removed; identity, note, receipt and accounting absence verified.");
} catch {
  console.error(`Recovery failed or fixture evidence did not match run ${runId}. No successful cleanup is claimed. Stop and report the run ID; do not reset the database.`);
  process.exitCode = 1;
}
