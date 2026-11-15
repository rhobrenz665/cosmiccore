# BUILD-03 Step 4c — quotas and retry receipts

Status: Owner's manual database check passed, including concurrent races and fixture cleanup | Date: 2026-11-15

Owner supplied all seven PASS lines plus cleanup and final success for run `0e5745cd-97cc-4a44-ad23-0c4801428af2`. The script's storage/receipt rollback, replay/lifecycle, concurrent account/global rate limits and owner-isolated receipt scenarios passed. This does not establish the additional final acceptance cases listed below.

Follow-up: [final database acceptance checks](build-03-acceptance.md) passed on development on 2026-11-15. Remaining deployment choices are documented in [operational gates](../07-deployment/build-03-operational-gates.md).

Owner approved this bounded part after the [ownership checks](build-03-ownership.md) passed. No new feature endpoint or content UI is enabled. Pause for manual results before the next step.

## Service boundary and transaction order

[withPrivateMutation](../../src/lib/db/private-mutation.ts) is a server-only service primitive. It derives identity from the verified session and loads operator configuration. Clients cannot supply owner IDs, quota deltas, policy, handlers or test clocks. Future feature services must validate payloads, origin/CSRF, resource state and expected revisions; this is not an unrestricted mutation API.

The [core coordinator](../../src/lib/db/mutation-core.ts) runs inside the existing transaction helper:

1. Validate operation/mutation identifiers and SHA-256 fingerprint bounded canonical JSON. Object key order does not affect fingerprints; array order and JSON value types do. Reject unsupported/cyclic/overdeep/oversized input.
2. Acquire a transaction advisory lock for the internal owner, serializing that owner's mutations. Then lock/check the active application account, including for replay. Locks expire with commit/rollback; hash collisions only serialize extra work.
3. Read the owner/operation/mutation receipt. Different payloads fail VALIDATION. At/after 24 hours fail EXPIRED while the receipt exists. Matching live receipts require current feature-specific resource authorization before returning whitelisted metadata. Replays skip mutation application and quota charging.
4. For a new mutation, the trusted handler checks ownership/state/revision and computes actual count/UTF-8 byte changes inside this transaction. Reserve all affected global usage rows in sorted metric order, then all account usage rows in sorted order. Include one mutation-rate unit. Concurrent initialization uses the same order.
5. Reject unsafe/missing caps, arithmetic overflow or counter underflow. Reject count/storage growth beyond either cap; rate rejection includes seconds to the next UTC minute. Negative/zero storage changes remain possible after an operator lowers a storage cap. Apply counter changes, feature changes and whitelisted success receipt metadata in the same transaction. Validate current result authorization before storing it.

Handlers are trusted application code, not browser input. They must supply accurate deltas and scoped writes; the coordinator cannot infer arbitrary SQL's storage effects. All callback work must be awaited. Errors must propagate to the transaction helper or an explicit savepoint rollback; do not catch them and commit partial work. External AI/network calls and automatic retries are prohibited inside this transaction. A fresh retry reconciles uncertain commit outcomes through the receipt.

Lifecycle/cleanup services must coordinate with this lock order: owner advisory lock, account status lock, global counters, account counters, then writes. A prepare handler may read/lock only that owner's resources. Do not acquire global counters and then wait for another transaction's account lock. Multi-account cleanup needs a separately reviewed ordering. In particular, account removal must settle global totals before cascading private rows; that cleanup is not implemented here.

## Limits and retained metadata

[Policy defaults](../../src/lib/db/quota-policy.ts) implement the feature proposals as initial local application limits: 200 notes/10 MiB (including Trash), 500 references/5 MiB, 50 collections, 100 tags and 60 distinct committed mutations per fixed UTC minute per account. They are not provider allowances or public capacity promises. Fixed windows can admit bursts across a minute boundary. Failed transactions and receipt replays do not consume committed usage; request/abuse throttling before expensive processing remains a public-release requirement.

Every global metric requires an explicit nonnegative safe integer in [environment configuration](../../.env.example): COSMICCORE_GLOBAL_NOTES_COUNT_LIMIT, NOTES_BYTES_LIMIT, REFERENCES_COUNT_LIMIT, REFERENCES_BYTES_LIMIT, COLLECTIONS_COUNT_LIMIT, TAGS_COUNT_LIMIT and MUTATIONS_COUNT_LIMIT, each with the COSMICCORE_GLOBAL_ prefix. All are required by the server mutation wrapper; zero explicitly disables new consumption. No guessed defaults or paid escalation. These capacities remain an unresolved operator choice; do not populate real environment values as part of this step. Reads and existing identity access do not require them. The manual check supplies its own isolated test policy, so no environment limit setup is necessary for it.

Count/storage totals use the epoch window; rate counters use the current UTC minute from the database clock after owner serialization. The internal test-clock override is absent from the production wrapper. Raw UTF-8 field bytes exclude database/index/receipt overhead and are not a total hosted-disk limit. No external/direct SQL writes may bypass ledger maintenance. A future import/backfill must reconcile preexisting records before enabling writes. Trash releases no storage; physical purge releases it exactly once through the appropriate feature service.

Receipts persist only entity ID, revision, counts and timestamps, never bodies/URLs/arbitrary JSON. Missing/trashed/deleted sources cannot be replayed through a handler requiring an active resource. Delete handlers may authorize their own metadata-only receipt tombstone, without recreating content. Logical expiry is enforced even before physical cleanup. Receipt/rate-row physical cleanup and scheduling remain unresolved operational work; no retention deletion guarantee is claimed yet. After receipts are physically removed, there is no permanent exactly-once guarantee: clients must never auto-retry beyond 24 hours.

## Owner's manual check

From the development repository terminal:

```bash
npm run db:check-mutations
```

The [check script](../../scripts/check-db-mutations.mts) first rolls back storage/retry fixtures, checking duplicate accounting, changed payloads, exact expiry, Trash/blocked replay denial, failed apply rollback, account/global storage rejection, underflow and one-time release. It then temporarily commits two synthetic application identities so independent connections can test duplicate races, account/global rate races and owner-isolated receipt IDs. Rate-race fixtures use exclusively inserted random future-minute global rows, never the live minute or committed lifetime counters. Their lifetime storage deltas are deliberately empty because this stage exercises rate accounting, not a feature create API. All related synthetic notes/receipts/account counters and reserved future global rows are cleaned in finally and absence is asserted. No real account content is read or changed.

Expect several PASS lines, `Synthetic committed race fixtures cleaned up.`, then `Mutation checks passed. Synthetic fixtures were removed.` The TypeScript module warning may appear as before. Let the command finish; interruption/network failure can leave committed race fixtures. Keep the printed run ID if any check or cleanup fails and report the output; do not reset the database or rerun migrations. Do not claim success from only the early PASS lines.

At the Step 4c implementation checkpoint, three pure rule tests (fingerprints/input bounds/configuration), TypeScript, lint, production build, script syntax, relative links and Git whitespace passed. The owner-run Step 4c database check and the later final acceptance both passed on development with synthetic fixture cleanup. Actual socket loss during COMMIT, public-action authorization and target-host runtime behavior remain unverified. No schema/migration, provider, package installation, commit or push was part of the Step 4c implementation.

References checked 2026-11-15: [PostgreSQL transaction locks](https://www.postgresql.org/docs/current/explicit-locking.html), [Drizzle inserts/conflicts](https://orm.drizzle.team/docs/insert), [Node SHA-256 API](https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options).
