# Release readiness gates

Status: In progress — BUILD-11 local and signed-in acceptance is partly verified; production release is not ready | Updated: 2026-11-25

| Gate | Required evidence | Current state |
|---|---|---|
| Product baseline | Reviewed PRD, workflows, scope and first-feature specification | Review package exists; lexical paraphrase threshold and partial-output checkpoint scope still need an owner decision |
| Public Google auth | Own production OAuth configuration; callback/origin/session/logout tests; no invite restriction | Local Google sign-in and sequential test-account switching work. Production OAuth origins, credentials, session expiry/revocation, and host terms are unverified |
| Isolation | Two-account denial tests for read/write/search/export/RAG/citations and cross-owner joins | Safari new-account checks denied direct access to a prior account's chat, note, and reference. Isolated DB checks passed ownership joins and retrieval filtering. A full authenticated read/write/search/export matrix remains incomplete |
| Capture reliability | Reload durability, concurrent-edit conflict, stale-delete and interrupted save tests | Prior BUILD-04 local acceptance covers autosave/reload, stale conflicts, and database quota/retry races. Target-host interruption behavior remains unverified |
| Data portability | UTF-8 import validation, owner-only bounded export and restore expectations | Markdown transfer is implemented locally; this final pass did not complete the full import/error/export ownership matrix or target-host limits |
| AI completeness | Selected free provider, privacy disclosure, evaluated retrieval/support/citations, failure handling | Synthetic hosted answers, exact citations, mixed sources, stale-link handling, refusal, cooldown, and browser Stop persistence passed locally. The lexical diagnostic matched 0/3 paraphrase cases. Production provider limits, latency, and failure headroom remain unverified |
| Spending/abuse | User/global atomic quotas, provider resource limits, kill switch, exhaustion behavior and load measurement | Isolated account/global reservation races and chat cooldown/daily caps passed. Production capacity values, provider headroom, load behavior, and deployed kill-switch verification remain open; see [BUILD-03 operational gates](build-03-operational-gates.md) |
| Accessibility | Keyboard, screen-reader labels, contrast, mobile, zoom, reduced motion and all appearances | Prior local keyboard/responsive checks exist. Full screen-reader, contrast, zoom, reduced-motion, and appearance-matrix review remains open |
| Deployment | Isolated previews, reviewed migration, eligible hosting, secret protection, build/checks | Local typecheck, lint, and production build pass; migration 0010 is applied to isolated development. No staging/production deployment, host-specific migration rehearsal, or production secret/origin validation is recorded |
| Deletion/privacy | Tested 7-day note Trash/restore/expiry, account access blocking and bounded live-data cleanup | Earlier isolated BUILD-05 Trash/purge acceptance passed. Account deletion remains disabled/unverified; current chat/source retention behavior is implemented, but production cleanup execution is not verified |
| Disaster recovery (future) | Independent backups, expiry, restore drill and deletion reconciliation | Deferred by owner; not an MVP release gate |
| Operations | Metadata-only logs, receipt/rate cleanup, role separation, usage/error monitoring and basic incident/rollback runbook | Cleanup schedule, DB role separation, deployed monitoring/alerts, and incident/rollback runbook remain unverified; see [BUILD-03 operational gates](build-03-operational-gates.md) |

## Release stages

1. Local development and private validation after explicit implementation authorization.
2. Knowledge-only pilot may open public Google registration once relevant security, storage, quota and recovery gates pass. Label AI unavailable if disabled. This stage does not satisfy the full AI MVP.
3. Full MVP adds validated grounded chat with bounded usage; interviews remain the next milestone.

Public registration is the approved product direction. Capacity limits and honest outage handling remain necessary on $0 infrastructure. Do not silently substitute paid services when limits are reached.

## Lifecycle and maintenance planning

See [account lifecycle](../03-technical/account-lifecycle.md) for approved deletion/history policies, and [backup/cleanup feasibility](backup-and-cleanup-plan.md) for remaining operational gaps. Application-managed backup and disaster recovery are deferred outside MVP; no 24-hour RPO guarantee is claimed.

## Approved account and backup policies — 2026-11-10

Confirmed account deletion blocks access immediately and targets removal of live app data within seven days, without a recovery grace period. Encrypted backups expire after seven days. The 7-day note Trash and 24-hour RPO target are unchanged. See [account lifecycle](../03-technical/account-lifecycle.md) for remaining implementation/history decisions. Earlier references to pending account/backup-retention approval are superseded by this confirmation; runtime verification and RTO remain outstanding.

## Current scope decision — 2026-11-10

Owner deferred application-managed backups and disaster recovery to a future milestone, outside MVP. Backup hosting remains undecided; no service is selected. The approved 24-hour RPO and seven-day encrypted backup retention apply to that future capability, not MVP guarantees or release gates. Existing provider history is incidental, not a promised recovery service. MVP keeps Markdown import/export, seven-day note Trash/restore, immediate account-deletion access blocking and live-data removal targeted within seven days. Cleanup required for those features remains in scope. This decision supersedes earlier backup/restore release gates in this document. No disaster-recovery guarantee is offered for MVP.

## Local acceptance update — 2026-11-25

The full automated suite passed (22 tests). Isolated transaction, owner-isolation, mutation/race, shared-quota, retrieval/revision, and chat acceptance checks passed. Signed-in Safari verified mixed-source answers and persistence, usage feedback, Stop cancellation with no saved answer, denial of cross-account links to a conversation, note, and reference, and a basic single-note Markdown export/import round trip. The imported duplicate was moved to Trash (restorable for seven days); the original fixture remains intact. Token counts persisted for a successful answer. Typecheck, lint, and optimized production build passed.

The BUILD-05 purge script was not rerun on the populated acceptance database: its initial guard requires zero existing notes and quota rows before exercising a database-wide purge. It stopped before creating fixtures or invoking purge and changed no rows. The previous clean-database BUILD-05 acceptance result remains documented in [the build plan](../03-technical/build-05-step-plan.md).

This evidence supports local MVP verification only. Production OAuth, host/deployment configuration, provider/account limits, production cleanup scheduling, monitoring and operational recovery remain open. The lexical paraphrase result is a product-quality decision, not a passing recall claim.
