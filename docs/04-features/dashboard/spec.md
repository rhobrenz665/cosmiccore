# Dashboard

Status: Proposed detailed specification | Updated: 2026-11-10

## Objective and stories

Help a signed-in user resume private knowledge work and capture a new idea quickly. A new user wants useful onboarding; a returning learner wants recent notes/references and their last conversation without navigation overhead. This is a navigation/summary feature, not learning analytics.

MVP: compact greeting, New Note, Save Reference, recent notes/references, owner-scoped optional counts, resume recent work and AI shortcut reflecting availability. Interviews/MCP/notifications/Pro plans/progress analytics remain deferred. No fabricated metrics, demo activity or public cross-user totals. Backups remain outside MVP.

## Workflow and content rules

1. Verify server session and active internal account before loading data. Signed-out users follow the supported sign-in flow; a deleting account is denied rather than re-created.
2. Load at most 5 active notes and 5 references per account, ordered updated_at/id descending. List item includes ID/title/updatedAt and safe type label; avoid loading full Markdown or descriptions just to show recent titles.
3. New Note invokes the existing idempotent create contract, then navigates after commit. Save Reference opens the same validated entry UI used on References. View all navigates to the appropriate list. Browser GET must not create records.
4. Resume recent work uses latest updated active note/reference, not a new activity-tracking subsystem. A future last-opened tracker is outside this slice. If no item exists, show first-use guidance. Resume chat targets most recently updated owned conversation once the chat feature exists; no dead chat links in the knowledge-only pilot.
5. Optional counts are exact owned active note/reference counts; note Trash excluded. Query within measured cost; omit counts if not implemented rather than presenting zero on failure. Counts are not progress scores. Chat count is unnecessary initially.
6. AI shortcut is available only when the chat route exists. Config-disabled or unavailable AI has a clear informational state; request-time quotas/provider checks still happen in chat. Avoid provider health pings/LLM calls on dashboard load. Do not infer availability from a cached badge alone.

## States and responsive layout

Initial load uses bounded skeleton regions with loading labels. New account shows create/import/save-reference guidance and no fake recent items. Successful empty region is different from failed query; a partial failure leaves successful regions usable with a local retry action. An auth failure is page-wide; a database failure may affect all data. Never swallow errors into an empty “0 notes” state.

Desktop: shared sidebar/header, short welcome region, quick capture actions, two recent-work sections. Mobile: compact header, stacked sections and bottom navigation. Appearance settings live in a compact control and Settings; keep the same semantic hierarchy across Cosmic/Minimal and all color schemes. Decorative hero must not push recent work far below the fold or interfere with contrast. Use shadcn/ui primitives and Lucide labels consistent with the accepted wireframes; no image generation or asset reuse implied.

Keyboard users can reach quick actions and each item link; use actual links for navigation and buttons for mutations/dialogs. Rows with secondary menus cannot nest buttons inside a link. Relative timestamps have an accessible absolute date; render locale/timezone-aware display while storage remains UTC. Missing/deleted-after-load targets show safe unavailable navigation and refresh the region. Respect reduced motion, mobile safe areas, 320px width and 200% zoom.

## Data/API contract and performance

Server Component calls getDashboard(sessionContext), not internal HTTP. Return independent Result values per data region plus a shared asOf UTC timestamp and configuration-derived chat state. Shared error envelope is defined in [first workflow contracts](../first-workflow/contracts.md). No owner ID is accepted from browser input.

Proposed shape: {asOf, recentNotes: Result<RecentNote[]>, recentReferences: Result<RecentReference[]>, counts?: Result<{notes,references}>, resumeChat?: Result<{conversationId,title,updatedAt}|null>, chatState: 'notReleased'|'disabled'|'enabled'}. Provider errors/quotas are evaluated only on chat requests; enabled means configured, not guaranteed service. A single dashboard request may have minor cross-region timing differences; it is not a consistent snapshot for financial/reporting purposes.

Use indexed (owner_id, updated_at, id) queries; notes also filter deleted_at IS NULL. Avoid per-row secondary queries. Parallelize independent bounded queries only within the configured connection budget. Data model needs no dashboard table or event warehouse. Private/no-store page/response behavior; request-local deduplication must not become a shared cross-account cache. Log region errors/timing/request IDs, not titles or content.

Proposed warm getDashboard service p95 under 1 second on max-size note/reference fixtures, measured with representative database region and concurrency; report cold starts separately. No polling loop or analytics dependency. Repeat loading only after relevant committed mutations/navigation/explicit retry; do not promise live cross-device counts.

## Acceptance and test scenarios

| ID | Scenario | Acceptance |
|---|---|---|
| DASH-01 | New account | Helpful create/import/reference entry; no illustrative records or metrics |
| DASH-02 | Existing data and equal timestamps | At most 5 items per list with stable ID tie-break; no Trash |
| DASH-03 | Two users/known IDs/cached navigation | Only current user's data; logout/account switch clears client state |
| DASH-04 | Recent references fail but notes succeed | Notes usable; reference retry shown; no false zero |
| DASH-05 | Duplicate New Note clicks or retry | One draft per mutation ID; navigate only after commit |
| DASH-06 | No chat route / disabled AI / available chat | Honest shortcut state; no provider calls on dashboard load |
| DASH-07 | Item deleted after load | Safe unavailable destination; refresh without foreign record disclosure |
| DASH-08 | Profile/title contains HTML or long Unicode | Escaped wrapping/truncation with accessible full label |
| DASH-09 | Keyboard/mobile/zoom/theme combinations | Navigable controls, visible focus and no overlapping chrome |
| DASH-10 | Account deletion/session expiry or total dependency failure | No private page data served; clear retry/sign-in state |

Integration tests verify filtering/order/query bounds and isolation; UI tests verify empty/partial-error states and navigation. Dependencies: auth, notes/references services, shared shell and configuration. Chat summary is conditional on its implementation and must not block notes-first development. No tests have run because application implementation is not authorized.
