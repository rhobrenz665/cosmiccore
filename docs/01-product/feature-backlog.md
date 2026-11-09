# Feature backlog

Status: Proposed | Ordered by dependency, not a delivery estimate

| Milestone | Deliverable | Exit condition |
|---|---|---|
| P0 Planning | Audience, budget, scope, auth decision | Owner decisions recorded |
| P1 Foundation | Identity, ownership, shared shell/tokens | Isolation and keyboard navigation verified |
| P2 Capture | Notes/autosave/import/export; references | Save/reload/export and conflict cases pass |
| P3 Retrieval | Collections/tags, search, filters, dashboard | Owner-scoped retrieval and empty states pass |
| P4 Grounded AI | Ingestion, chat, citations/history, quotas | Quality evaluation, deletion, failure and cost gates pass |
| P5 Release | Responsive QA, recovery drill, operational checks | Release checklist complete |
| Next | Text mock interviews | Separate approved specification and AI budget |
| Future | MCP, sharing, offline/native, voice, graphs, analytics, Telegram | Evidence of need and separate architecture review |

Every implementation milestone requires explicit authorization after its specification is reviewable. Dependencies do not authorize work automatically.

## Owner clarification — 2026-11-10

The app is publicly accessible, including personal use by the owner and family. Starting monthly budget is $0; no paid services or automatic paid overages are authorized. Mock interviews are confirmed for the next milestone. Separate private accounts and Google sign-in are confirmed. Public Google registration is confirmed; the auth library/service remains to be evaluated. These confirmations supersede earlier audience/budget assumptions in this draft.

## Knowledge workflow decisions

Confirmed on 2026-11-10: Markdown notes with an editor and preview; flat collections plus tags; individual `.md` import/export and bulk Markdown export. Rich-text editing, nested collections, PDF/Word import and automatic website extraction are deferred. Bulk export packaging and metadata fidelity remain specification details.
