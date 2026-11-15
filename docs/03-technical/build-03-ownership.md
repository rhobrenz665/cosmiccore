# BUILD-03 Step 4b — active accounts and private reads

Status: Owner's manual database check and normal sign-in smoke checks passed | Date: 2026-11-15

Owner supplied all three PASS lines, then confirmed the final fixture-rollback success message and normal dashboard reload/sign-out/sign-in. This verifies the script's shared-core scenarios; concurrent blocking and the unavailable-account UI with a real blocked session remain untested. Owner subsequently approved [quota and retry enforcement](build-03-mutations.md), whose manual checks remain pending.

Owner explicitly approved this part after Step 4a passed. Pause for results and approval before implementing quota and retry enforcement. Existing [data invariants](database-design.md) and [workflow contracts](../04-features/first-workflow/contracts.md) remain the baseline.

## Implemented boundary

[private-data.ts](../../src/lib/db/private-data.ts) is server-only. It derives the internal owner from requireAppUser and opens a new transaction; callers cannot supply an authoritative owner ID. getPrivateNote, getPrivateReference, getPrivateCollection and getPrivateTag expose fixed, parameterized lookups with bounded projections. They are internal primitives, not finished feature APIs: organization/tag aggregates, search, pagination, transfers and feature result envelopes remain in their respective builds. There is no raw transaction or generic table selector in the private-read interface.

The [internal core](../../src/lib/db/owned-data.ts) locks the mapped app_users row FOR SHARE and requires active status. The lock lasts until transaction completion and conflicts with account status updates/deletion. Operations already holding the lock finish before a block can commit; later operations reject the committed block. Blocking must not use FOR KEY SHARE, which would allow non-key status updates. No immediate provider-token revocation is claimed.

Every resource query includes the derived owner. Notes also require deleted_at IS NULL. Valid foreign, missing and trashed resource IDs all throw NOT_FOUND with the same message and no content; malformed UUIDs throw VALIDATION. Returned fields omit owner IDs and private identity/profile data. Missing, blocked and deletion-pending accounts throw ACCOUNT_UNAVAILABLE. The server wrapper awaits all work inside the transaction; do not retain the reader outside its callback.

assertAssociations validates optional collection and at most 20 distinct tag UUIDs, comparing UUID case consistently. It locks owned association targets FOR KEY SHARE, preventing their deletion until the caller's transaction ends. Matching composite foreign keys remain the database backstop. Services must still enforce source-note active state, expected revisions, quotas and receipts when writes are introduced. No content mutation method, Server Action or new HTTP endpoint is exposed here.

Identity profile upsert now updates existing mappings only while active. Nonactive mappings cannot have their profile refreshed or status reset by this path. Their existing-session redirect reaches the unavailable-account sign-in state instead of looping back to the dashboard; a sign-out button permits switching accounts. This query-string UI state grants no access. Account erasure/re-registration and provider-session cache policy remain separate release work.

## Owner's manual check

Using the existing development environment, run:

```bash
npm run db:check-ownership
```

The [check script](../../scripts/check-db-ownership.mts) creates four synthetic identities and related resources inside one deliberately rolled-back transaction. It checks two-way own/foreign reads for all four resource types, generic missing results, UUID validation, Trash exclusion, association validation, five cross-owner foreign-key failures via savepoints, and blocked/deletion-pending/missing/newly blocked account denial. A subsequent transaction verifies no synthetic identity remains. It reads no real account content and commits no fixture rows. Do not rerun migrations or reset the database for a failure.

Expected final output: `Ownership checks passed. All synthetic fixtures were rolled back.` The command may produce the same informational TypeScript ES-module reparse warning as the previous check. Share PASS output or redacted failure, then wait for the next part.

Also confirm normal dashboard reload/sign-out/sign-in still works. The unavailable-account redirect/sign-out UI has not been exercised with a real blocked session; do not manually block a real account for this check. This script exercises the shared database core, not the auth SDK or public route boundaries. Concurrent account blocking/lock behavior, unauthorized direct mutations and quotas/receipt races remain later acceptance work.

Local verification: TypeScript, lint, production build, script syntax, relative links and Git whitespace. Live database execution is left to the owner. No schema change, migration or dependency install.

References checked 2026-11-15: [PostgreSQL row locks](https://www.postgresql.org/docs/current/explicit-locking.html), [Drizzle selects](https://orm.drizzle.team/docs/select), [conditional upserts](https://orm.drizzle.team/docs/insert).
