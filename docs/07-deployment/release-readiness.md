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
| Recovery/privacy | Approved deletion/retention, independent backup/export strategy, successful isolated restore drill | 7-day note Trash and 24-hour RPO confirmed; backup mechanism, RTO and remaining retention pending |
| Operations | Metadata-only logs, usage/error monitoring, basic incident and rollback runbook | Draft plan only |

## Release stages

1. Local development and private validation after explicit implementation authorization.
2. Knowledge-only pilot may open public Google registration once relevant security, storage, quota and recovery gates pass. Label AI unavailable if disabled. This stage does not satisfy the full AI MVP.
3. Full MVP adds validated grounded chat with bounded usage; interviews remain the next milestone.

Public registration is the approved product direction. Capacity limits and honest outage handling remain necessary on $0 infrastructure. Do not silently substitute paid services when limits are reached.
