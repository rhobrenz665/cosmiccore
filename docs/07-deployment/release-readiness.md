# Release readiness gates

Status: Proposed — none verified by a running application

| Gate | Required evidence | Current state |
|---|---|---|
| Product baseline | Reviewed PRD, workflows, scope and first-feature specification | Overall review draft prepared; feature detail pending |
| Public Google auth | Own production OAuth configuration; callback/origin/session/logout tests; no invite restriction | Provider integration unselected |
| Isolation | Two-account denial tests for read/write/search/export/RAG/citations and cross-owner joins | Not implemented |
| Capture reliability | Reload durability, concurrent-edit conflict, stale-delete and interrupted save tests | Not implemented |
| Data portability | UTF-8 import validation, owner-only bounded export and restore expectations | Export packaging/limits pending |
| AI completeness | Selected free provider, privacy disclosure, evaluated retrieval/support/citations, failure handling | Blocked on provider feasibility |
| Spending/abuse | User/global atomic quotas, resource limits, kill switch, exhaustion behavior and load measurement | Exact limits pending |
| Accessibility | Keyboard, screen-reader labels, contrast, mobile, zoom, reduced motion and all appearances | Wireframes/implementation pending |
| Deployment | Isolated previews, reviewed migration, eligible hosting, secret protection, build/checks | No infrastructure |
| Deletion/privacy | Tested 7-day note Trash/restore/expiry, account access blocking and bounded live-data cleanup | Policies confirmed; implementation and remaining history policy pending |
| Disaster recovery (future) | Independent backups, expiry, restore drill and deletion reconciliation | Deferred by owner; not an MVP release gate |
| Operations | Metadata-only logs, usage/error monitoring, basic incident and rollback runbook | Draft plan only |

## Release stages

1. Local development and private validation after explicit implementation authorization.
2. Knowledge-only pilot may open public Google registration once relevant security, storage, quota and recovery gates pass. Label AI unavailable if disabled. This stage does not satisfy the full AI MVP.
3. Full MVP adds validated grounded chat with bounded usage; interviews remain the next milestone.

Public registration is the approved product direction. Capacity limits and honest outage handling remain necessary on $0 infrastructure. Do not silently substitute paid services when limits are reached.

## Lifecycle and maintenance planning

See [account lifecycle](../03-technical/account-lifecycle.md) for Proposed deletion/history policies, and [backup/cleanup feasibility](backup-and-cleanup-plan.md) for validated tool capabilities and remaining operational gaps. Immediate logical expiry is distinct from delayed physical purge. The 24-hour RPO remains unverified until the backup/restore workflow is tested.

## Approved account and backup policies — 2026-11-10

Confirmed account deletion blocks access immediately and targets removal of live app data within seven days, without a recovery grace period. Encrypted backups expire after seven days. The 7-day note Trash and 24-hour RPO target are unchanged. See [account lifecycle](../03-technical/account-lifecycle.md) for remaining implementation/history decisions. Earlier references to pending account/backup-retention approval are superseded by this confirmation; runtime verification and RTO remain outstanding.

## Current scope decision — 2026-11-10

Owner deferred application-managed backups and disaster recovery to a future milestone, outside MVP. Backup hosting remains undecided; no service is selected. The approved 24-hour RPO and seven-day encrypted backup retention apply to that future capability, not MVP guarantees or release gates. Existing provider history is incidental, not a promised recovery service. MVP keeps Markdown import/export, seven-day note Trash/restore, immediate account-deletion access blocking and live-data removal targeted within seven days. Cleanup required for those features remains in scope. This decision supersedes earlier backup/restore release gates in this document. No disaster-recovery guarantee is offered for MVP.
