# Feature backlog

Status: Proposed | Ordered by dependency, not a delivery estimate

| Milestone | Deliverable | Exit condition |
|---|---|---|
| P0 Planning | Audience, budget, scope, auth decision | Owner decisions recorded |
| P1 Foundation | Identity, ownership, shared shell/tokens | Isolation and keyboard navigation verified |
| P2 Capture | Notes/autosave/import/export; references | Save/reload/export and conflict cases pass |
| P3 Retrieval | Collections/tags, search, filters, dashboard | Owner-scoped retrieval and empty states pass |
| P4 Grounded AI | Ingestion, chat, citations/history, quotas | Quality evaluation, deletion, failure and cost gates pass |
| P5 Release | Responsive QA, note/account cleanup, operational checks | Release checklist complete |
| Next | Text mock interviews | Separate approved specification and AI budget |
| Future | MCP, sharing, offline/native, voice, graphs, analytics, Telegram | Evidence of need and separate architecture review |

Every implementation milestone requires explicit authorization after its specification is reviewable. Dependencies do not authorize work automatically.

## Owner clarification — 2026-11-10

The app is publicly accessible, including personal use by the owner and family. Starting monthly budget is $0; no paid services or automatic paid overages are authorized. Mock interviews are confirmed for the next milestone. Separate private accounts and Google sign-in are confirmed. Public Google registration is confirmed; the auth library/service remains to be evaluated. These confirmations supersede earlier audience/budget assumptions in this draft.

## Knowledge workflow decisions

Confirmed on 2026-11-10: Markdown notes with an editor and preview; flat collections plus tags; individual `.md` import/export and bulk Markdown export. Rich-text editing, nested collections, PDF/Word import and automatic website extraction are deferred. Bulk export packaging and metadata fidelity remain specification details.

## Current scope decision — 2026-11-10

Owner deferred application-managed backups and disaster recovery to a future milestone, outside MVP. Backup hosting remains undecided; no service is selected. The approved 24-hour RPO and seven-day encrypted backup retention apply to that future capability, not MVP guarantees or release gates. Existing provider history is incidental, not a promised recovery service. MVP keeps Markdown import/export, seven-day note Trash/restore, immediate account-deletion access blocking and live-data removal targeted within seven days. Cleanup required for those features remains in scope. This decision supersedes earlier backup/restore release gates in this document. No disaster-recovery guarantee is offered for MVP.

## Detailed task breakdown

The [ordered implementation backlog](implementation-backlog.md) refines this milestone list with dependencies and completion evidence. Database-backup restore drills remain deferred; MVP recovery here means note Trash/restore, not disaster recovery.
