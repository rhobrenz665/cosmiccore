# BUILD-05 — Trash and note cleanup

Status: BUILD-05 implementation and targeted acceptance complete; maintenance trigger remains Proposed | Updated: 2026-11-18

## Objective and scope

Recover accidentally deleted private notes for seven days, then clean them up safely. The owner authorized BUILD-05 feature by feature, using 6.1 Sol Medium for implementation and a different model for testing. Pause at each feature handoff before running tests. Each feature gets a separate branch. No deployment or provisioning is authorized by this plan.

Contracts: [first workflow](../04-features/first-workflow/spec.md), [service contracts](../04-features/first-workflow/contracts.md), [retention policy](../07-deployment/data-retention-and-recovery.md), [implementation backlog](../01-product/implementation-backlog.md).

## Steps

1. **BUILD-05.1 — Logical Trash and restore:** move a saved note with confirmation and expected revision; list private Trash with bounded cursor pagination; restore strictly before expiry. Implemented on `codex/build-05-1-trash-restore`. Safari smoke verification passed: create and save a disposable note, cancel confirmation, move to Trash, and restore it to the editor. The synthetic acceptance harness also verifies private list/read, cursor pagination, quota neutrality, replay, stale revision, expiry denial and restore metadata. Keyboard/screen-reader, mobile and failure-injection behavior remain unverified.
2. **BUILD-05.2 — Physical purge:** implemented an internal primitive on `codex/build-05-2-purge`. It handles at most 100 owners and at most the selected batch size per owner transaction, deletes only database-expired notes, and releases account/global count and byte totals atomically. It returns the purged count and whether overdue work remains. Static checks and isolated runtime/database acceptance passed.
3. **BUILD-05.3 — Trigger recommendation (Proposed):** daily invocation in an existing trusted application host; batches capped at 50 notes per owner transaction; bounded repeated drains until the invocation approaches its host deadline, then resume next invocation. Roll back a failed owner batch and emit metadata-only error signals. Alert on repeated backlog or when the oldest expired item exceeds a proposed 48-hour operational target. These are recommendations, not approved settings or a physical-erasure promise. No scheduler, route, secret or provider is configured.
4. **BUILD-05.4 — Runtime acceptance:** completed against isolated Neon project `lingering-fire-94844546`, development branch `br-steep-math-aznaz6tc`, database `cosmiccore_dev`, using `.env.acceptance.local`. Run `ac74f344-2d54-4315-bb23-cf8fb2ad9a66` passed bounded purge, repeat/idempotency, recent-Trash retention, account/global quota release, foreign-owner hiding/survival, 50-row cursor pagination including tied timestamps, invalid cursor, Trash receipt replay, stale revision denial, expired restore denial, restore content/collection, concurrent save/Trash serialization, and concurrent restore/purge. Synthetic app identities, notes and quota rows were cleaned and absence verified. Final counts after cleanup: `app_users=0`, `notes=0`, `quota_usage=0`, `global_quota_usage=0`, `mutation_receipts=0`; three Neon Auth identities remain for sign-in. The harness invokes the production purge and ownership/mutation cores with synthetic lifecycle/save handlers; Safari separately exercised the real UI flow. It does not exercise authenticated Server Action wrappers or every UI error/accessibility state.
5. **BUILD-05.5 — Close-out:** implementation and targeted acceptance are documented. Keep executor, schedule and alert target Proposed. No trigger or deployment is configured; public physical-erasure timing is not guaranteed.

## BUILD-05.1 feature contract

Story: as an account holder, I can move a saved note out of my active workspace and recover it before its seven-day deadline without exposing it to another account.

Requirements/workflow:

- Move to Trash is available only when the editor has acknowledged its current buffer. Confirmation describes the seven-day window and continued storage usage.
- The service validates UUIDs, action and positive revision. Existing private mutation coordination supplies verified identity, active-account locking, idempotency receipts and rate accounting.
- Lock the owner-matched note, reject the wrong lifecycle or revision, bump revision and set database-derived UTC deletion time plus exactly 168 hours. No note-count or note-byte release occurs.
- Active list/read/save already require `deleted_at IS NULL`; stale saves cannot revive a trashed note. Future search/AI must retain the same eligibility rule.
- `/trash` returns at most 50 metadata rows plus one lookahead, ordered by deletion time and ID descending. Cursor time preserves database precision. Cursors are validated and every query is owner-scoped.
- Restore locks the same row and checks `purge_after > clock_timestamp()` in the update statement, after quota coordination. It clears Trash timestamps and increments revision without reserving another note.
- Successful actions navigate to Trash or the restored note. Pending or uncertain move requests lock editor fields. Uncertain results retain the same mutation ID/payload for retry; known failures preserve the editor and unlock it.
- Trash receipt replay is a metadata acknowledgement even after restore/purge; it never applies the deletion again. Restore replay still requires an active authorized note. Retry expiry requires reloading current state.

States: empty Trash; end of pagination; invalid cursor/load error with reload; pending; uncertain retry; revision conflict with reload instruction; missing/wrong-state generic error; expired restore; expired rows labeled awaiting permanent cleanup. Native confirmation provides cancel/confirm. Controls have textual names, error announcements and minimum 44px button height; actual keyboard/screen-reader behavior awaits testing.

Data/API dependencies: reuse existing notes lifecycle columns, constraints, Trash/purge indexes and receipt metadata. No migration, dependency installation, new provider or remote fetch. Server Action accepts only note ID, revision, action and mutation ID; clients cannot provide owners, clocks or usage deltas. No note bodies appear in Trash projections. Account cleanup and physical purge are separate work.

Acceptance and tests pending:

- Move hides a note immediately from active list/read; reload persists deletion and the Trash deadline.
- Cancel makes no mutation; unsaved/error/conflicted editors cannot initiate deletion.
- Two-account list/direct mutation/cursor attempts disclose no foreign data.
- Trash/autosave races cannot overwrite or revive; stale revisions fail.
- Restore just before expiry succeeds; equality/after expiry fails even with delayed physical cleanup.
- Restored notes retain content and surviving organization assignments; deleted organizations stay absent.
- Lost-response retries apply each transition once; receipt replay after subsequent lifecycle changes does not repeat it.
- Storage counters stay unchanged through Trash/restore; mutation rate limits remain enforced.
- Pagination handles equal timestamps; error/empty states differ; keyboard/mobile/error announcements are usable.
- Run typecheck, lint, production build and relevant existing checks after model switch, then authorized synthetic runtime/database acceptance. No acceptance evidence is claimed yet.

Future/outside this feature: activating a maintenance trigger awaits an owner choice of executor and environment. Backups, version history, manual permanent-delete controls, AI indexing and account deletion are excluded.


## Isolated test setup — 2026-11-17

Both existing Drizzle migrations are applied to `cosmiccore_dev` on the dedicated development project. `npm run db:check-build-05` reads only ignored `.env.acceptance.local` and pins the project, branch host and database. It requires no preexisting notes or quota ledgers, then creates uniquely tagged synthetic owners/fixtures. Cleanup removes only those fixtures and subtracts their usage across every affected quota window; it preserves any other account. The purge core and private ownership/mutation cores are exercised. This is isolated acceptance, not provider scheduling or authenticated UI automation.


## BUILD-05.2 isolated purge acceptance — 2026-11-17

Run `82f3eb94-e5d0-48c0-a0d4-bdfb79ffdae6` passed on `cosmiccore_dev` for the initial purge coverage. Expanded acceptance run `ac74f344-2d54-4315-bb23-cf8fb2ad9a66` passed on 2026-11-18; details are recorded in BUILD-05.4 above. `npm run typecheck`, `npm run lint`, `npm run test:mutation-rules`, `npm run build`, and `git diff --check` passed. The schedule/executor/alert decisions remain Proposed. The test harness uses synthetic handlers for lifecycle/save and does not invoke their session-authenticated Server Action entry points.
