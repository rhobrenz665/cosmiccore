# BUILD-03 Step 4a — transaction support

Status: Local implementation; owner's manual development runtime check passed | Date: 2026-11-15

Owner reported all three PASS lines and the final success message: commit/result return, callback-error rollback, SQL-error rollback and a subsequent successful transaction. Node also reported reparsing the TypeScript helper as an ES module; this warning did not prevent the checks. No package-wide module setting was changed. Connection-loss and broader isolation/concurrency cases remain pending.

Owner approved beginning Step 4 after being offered transaction support as its first small part. After reporting a successful runtime check, the owner approved [Step 4b ownership checks](build-03-ownership.md). Quotas and receipts still pause for separate review/approval.

## Implemented boundary

[withDbTransaction](../../src/lib/db/transaction.ts) is the server-only entry point. It reads DATABASE_URL and passes a typed Drizzle transaction to trusted server code. Its internal [session helper](../../src/lib/db/transaction-session.ts) creates a Neon WebSocket Client for each operation, commits on success, rolls back on errors through Drizzle and closes the connection in finally, including failed connections/BEGIN. It uses the existing installed packages and requires Node 22+ with native WebSocket enabled. Existing HTTP identity queries remain unchanged.

Connection timeout is five seconds; query timeout is fifteen seconds; transaction-local statement and idle-transaction limits are ten seconds, and lock wait is three seconds. These are initial operational defaults, not measured performance guarantees or a total callback deadline. No AI calls or other external work may run within a transaction. Connection/cleanup diagnostics contain fixed text only; a cleanup failure does not mask a mutation error or misreport an already committed mutation as failed. No automatic mutation retry is added; commit uncertainty must later be reconciled through receipts.

This helper is not an authorization service. The next part must verify the session, lock/check active account state and scope every query to its internal owner ID before any public action uses it. No new public route or feature write is exposed in this part. RLS, role changes and deployment runtime verification remain pending.

## Owner's manual check

From the repository terminal, with the existing development environment loaded:

```bash
node --version
npm run db:check-transactions
```

Use Node 22 or newer. This command uses DATABASE_URL, not the migration connection. Confirm it is the intended development database. No migration or package install is required.

The [check script](../../scripts/check-db-transactions.mts) verifies successful interactive execution/commit using a temporary table, callback-error rollback of a uniquely identified synthetic app_users insert, SQL-error rollback of another synthetic insert, and subsequent successful transactions. The SQL failure must have the expected division-by-zero SQLSTATE. Successful work commits no permanent test records; the temporary table drops on commit and synthetic accounts are deliberately rolled back. No real account content is read.

Expected output ends with three PASS lines and `Transaction checks passed. No permanent test records were committed.` The owner supplied this success output. For future failures, share redacted output; do not rerun migrations or reset the database to fix a test error. Connection-loss cases and broader isolation/concurrency acceptance remain unverified until exercised.

Local validation: TypeScript, lint, production build, script syntax and Git whitespace checks. The owner ran the live transaction check; the agent did not run it.

References checked against installed APIs on 2026-11-15: [Neon driver lifecycle](https://neon.com/docs/serverless/serverless-driver), [Drizzle Neon integration](https://orm.drizzle.team/docs/connect-neon), [Drizzle transaction semantics](https://orm.drizzle.team/docs/transactions).
