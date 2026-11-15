# BUILD-03 — final database acceptance checks

Status: Passed on development; see recorded runs below | Date: 2026-11-15

Owner authorized task 1 (final database acceptance) after the [quota/retry checkpoint](build-03-mutations.md). This part supplies checks for storage concurrency, account-block/write ordering and connection failure/retry behavior. BUILD-04 is not started. No migration, environment change or global capacity selection is required.

## Run in development

From the repository terminal, using the existing development environment:

```bash
npm run db:check-acceptance
```

The [script](../../scripts/check-db-acceptance.mts) prints a run ID, eight PASS lines, `Synthetic acceptance fixtures cleaned up.`, and finally `Final database acceptance checks passed. Synthetic fixtures were removed.` Share the PASS lines and both final messages. Preserve the run ID on failure or interruption; report the stage and redacted output. Do not reset the database, rerun migrations or broaden privileges to make a check pass.

The disconnect case intentionally expires its own idle database session. Fixed messages such as `Database transaction connection failed.` or `Database transaction connection cleanup failed.` can occur during this case. The final checks and cleanup determine success. If the host does not enforce the idle timeout, the check fails and rolls back rather than treating that as a pass. The existing Node module reparse warning is informational.

## Coverage and expected evidence

| Case | Acceptance evidence |
| --- | --- |
| Account count and byte races | Separate connections submit two distinct creates for one owner under a one-note or nine-byte test cap; exactly one succeeds and one returns QUOTA_EXCEEDED. |
| Global count and byte races | Separate owners compete for the same isolated accounting window; exactly one succeeds. |
| Accounting atomicity | Each storage race leaves one receipt pointing to an owned note, one count/nine bytes globally, matching account totals, and one rate unit. Rejected work leaves no additional charged usage. |
| Write obtains lifecycle lock first | Hold a mutation before its content insert; observe the competing block waiting in PostgreSQL; release the writer and commit the block. Later writes fail ACCOUNT_UNAVAILABLE. The earlier write precedes the block. |
| Block obtains lifecycle lock first | Hold the synthetic blocked status uncommitted; observe the writer waiting; commit the block. The writer rejects and leaves no note, receipt or usage rows. |
| Lost success response, simulated | Discard an acknowledged result; resubmit the same request. Receipt replay returns the same entity without charging twice. This does not cut a socket during COMMIT. |
| Precommit failure and retry | Inject an exception before content application, then retry the same request on a fresh transaction; exactly one successful reservation remains. |
| Own-session connection loss | After writing synthetic content/counters/receipt, set a transaction-local one-second idle timeout and wait 1.6 seconds. Require the next query to fail, verify rollback of content, receipt and both ledgers, then retry successfully through a fresh connection. |

Both block-order cases use the documented owner advisory lock followed by account status locking. They verify the intended lifecycle protocol, not an account-deletion feature or session-backed blocked-account UI. A competing operation must be observed in a database lock wait; elapsed time alone is not accepted as evidence. The observer polls only the synthetic session PID for at most two seconds. Existing lock and idle timeouts remain bounded, so an unusually slow environment may fail the check and require investigation.

## Fixture safety and internal test seams

Eight UUID identities use a unique `urn:cosmiccore:acceptance-check:<run-id>` issuer. Temporary committed notes and receipts belong only to those identities. Global accounting uses exclusively inserted random future-minute rows; the script never updates the live lifetime epoch rows or current rate window and never selects real account content. No database schema or service is created.

The internal [mutation core](../../src/lib/db/mutation-core.ts) accepts an optional storage-window override for this check, alongside the existing clock override. It requires a supplied test clock and a valid window in year 2100 or later. The [server-only wrapper](../../src/lib/db/private-mutation.ts) supplies neither override; application storage continues to use the epoch. This window is solely an isolated ledger namespace for synthetic tests, not a quota policy or production accounting change.

Finally cleanup removes only matching issuer/owner identities and the exact reserved metric/window rows, then checks absence of identities, notes, receipts and account/global counters. Account deletion here relies on existing fixture cascades; it is not production erasure code. If setup COMMIT acknowledgment is lost, cleanup checks for all eight unique identities before removing their reserved windows. If setup rolled back, colliding preexisting windows are left untouched. Process interruption or a lost cleanup connection can still leave fixtures: stop and preserve the run ID for a scoped recovery review.

## Deterministic local connection checks

```bash
npm run test:connection-lifecycle
```

Six tests cover connect failure, work failure, simulated uncertain-commit rejection, cleanup failure after acknowledged success, stalled disconnect paths and connection error during a stalled operation. They assert one close attempt, propagation of the original error, no automatic retry and preservation of a successful result despite close failure. The internal [connection lifecycle](../../src/lib/db/connection-lifecycle.ts) is used by the real transaction transport. These are injected lifecycle failures, not a driver/socket fault experiment. Existing mutation-rule tests cover input fingerprints and safe policy parsing.

## Limits and next checkpoint

### Development run results — 2026-11-15

Run `5dacfc74-4c81-4eb3-aebc-7035d73539dd` failed during fixture setup and its cleanup connection also failed. A separate read-only lookup found zero identities for that run. Since identity and reserved-window rows are inserted in one transaction, setup left no committed fixtures. The original transport error was not exposed by the script's catch block, so its precise cause is unknown.

Added redacted error-chain reporting to the acceptance script, then reran it as `69cac6ef-2d2d-4801-ade9-b2163e16cf27`. All eight acceptance cases passed: account/global count and byte races, both account-block/write orderings, retry reconciliation, and own-session disconnect/rollback followed by retry. The script printed `Synthetic acceptance fixtures cleaned up.` and `Final database acceptance checks passed. Synthetic fixtures were removed.` The expected connection failure message appeared during the deliberate own-session disconnect. The module reparse warning was informational.

Actual socket loss exactly during COMMIT remains unverified; the script separately checks known rollback, known committed replay and an actual own-session disconnect before COMMIT. No exactly-once guarantee beyond retained receipts is added. Target-host runtime, application/migration role separation, global capacity configuration, physical metadata cleanup, session-backed blocked-account UI and future public-action authorization remain separate gates. A passing run does not complete all BUILD-03 or public-release requirements.

Automated connection lifecycle tests were also run: all six tests passed. See [project status](../../PROJECT_STATUS.md) for the current checkpoint and the [remaining operational gates](../07-deployment/build-03-operational-gates.md) before public activation. BUILD-04 implementation is tracked separately and does not close these gates.

Official PostgreSQL references checked 2026-11-15: [idle transaction timeout](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-IDLE-IN-TRANSACTION-SESSION-TIMEOUT) terminates an idle transaction session; [session information functions](https://www.postgresql.org/docs/current/functions-info.html#FUNCTIONS-INFO-SESSION) document backend PIDs and lock blockers. Enforcement through the development connection remains a runtime check, not an assumed provider guarantee.
