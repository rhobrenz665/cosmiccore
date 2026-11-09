# First workflow: private knowledge capture and recovery

Status: Proposed implementation contract | Updated: 2026-11-10

## Objective and boundaries

A new Google user can create a private Markdown note, organize and search it, export it, and recover it from Trash. User stories: as a learner I want durable capture; as a returning user I want to retrieve my ideas; as an account holder I want privacy and portable notes; as a user who deletes accidentally I want seven days to restore.

Confirmed product choices: public Google registration, separate private accounts, Markdown editor/preview, flat collections/tags, individual .md import/export, bulk Markdown export, 7-day Trash and 24-hour disaster recovery target. The accepted wireframes provide initial layout direction; shadcn/ui is the component foundation. Everything below that adds technical behavior or limits is Proposed, not implied owner approval.

Includes sign-in/logout, minimal private dashboard, note CRUD/autosave, collection/tag operations, note search/filtering, transfer and Trash. References/combined resource search remain part of the overall MVP but not this first implementation slice. No AI service, interviews, sharing, nested collections, binary uploads or offline synchronization is required here. Account deletion is a separate specification and a public-release gate.

## Dependencies and readiness

- Auth: recommended Neon managed Better Auth with Google. Validate its current Next.js SDK, session verification, public OAuth setup, free allowances and deployment configuration before implementation. No auth service is provisioned or approved by this document.
- Database: app user mapping, notes, collections, tags, note_tags, mutation receipts and bounded usage counters. Use server-only Drizzle services and reviewed migrations; validate driver transaction behavior before choosing APIs.
- UI: shadcn/ui buttons/forms, AlertDialog for deletion, Dialog/Sheet for import/filtering, DropdownMenu for note actions, Tabs for mobile Edit/Preview. Keep Markdown editing lightweight; no new editor framework without evidence.
- Operations: private environments, controlled migrations, quota counters and recovery plan. Application-managed backups/disaster recovery are deferred; 24-hour RPO is a future target, not an MVP guarantee.

## Proposed validation and limits

These conservative starting values bound work; measure and revise before deployment. Centralize them in server configuration and mirror UI hints. They are application choices, not vendor allowances.

| Input/resource | Proposed limit/rule |
|---|---|
| Title | Trim outer whitespace; up to 200 Unicode code points; empty displays Untitled |
| Markdown | Up to 256 KiB UTF-8 per note; preserve source text, accept empty body |
| Collection/tag name | Trim, normalize NFC, 1–60 code points; case-insensitive unique per owner and kind |
| Associations | Zero/one collection and up to 20 distinct tags per note |
| Per-account storage | 200 notes including Trash and 10 MiB combined UTF-8 title/body, enforced transactionally |
| Organization | Up to 50 collections and 100 tags per user |
| Search | Up to 200 code points; pages of 20, maximum 50 |
| Markdown import | One .md per request; at most 256 KiB file bytes; fatal UTF-8 decode, reject NUL/binary content |
| Bulk export | All active notes, at most 200 notes / 10 MiB raw; streamed ZIP with total deadline; load-test before release |
| Authenticated mutations | Proposed 60/min/user across note/organization/import mutations; returns retryAfter |

Global enrollment/storage/compute ceilings must be set from actual hosted quotas before public activation; a placeholder global number must not masquerade as safe capacity. Quota rejection must not silently enable paid resources. Trashed content counts against storage; restore does not create another note or consume new storage. Reads/exports remain available where infrastructure permits.

## Main workflow and UI states

1. Google sign-in: new identity maps idempotently to one app user; returning identity reuses it. Only local validated return paths are allowed. Canceled consent returns to sign-in; errors show retry, never credentials. Auth unavailable denies protected access.
2. Dashboard: empty state offers New Note and Import; populated state lists recent owned active notes, ordered updated_at then id descending. No fake activity/counts. Search and recent results never include Trash.
3. Create: explicit New Note creates a blank draft with revision 1 using a client-generated mutation ID. Disable duplicate submission. Redirect to its editor only after commit; failure preserves a retry action. Concurrent retry reuses the same record.
4. Edit: title/body/collection/tag changes use one revision-controlled mutation. Debounce 1 second after input; serialize requests per editor. Edits typed during a request remain dirty and enqueue another save after acknowledgment. Show Saved only when the acknowledged content matches the current editor buffer.
5. Resolve conflict: keep the local buffer, show the freshly authorized server version and timestamps, offer Use server version or Save my version after explicit confirmation. Save my version uses the newest expected revision; a further concurrent change returns another conflict. No automatic merge or blind overwrite.
6. Organize: create/rename/delete flat collections and tags. Deleting collection clears its assignments; deleting tag removes associations; notes survive. Association changes bump note revision. Batch effects from deleting a collection/tag bump affected note revisions so stale clients cannot recreate deleted associations.
7. Search: submit query/filters through URL parameters; owner scope is server-derived. Empty query lists active notes. Proposed search configuration: simple PostgreSQL text search, title weighted above body; websearch-style parsing with bound parameters. Query rank desc then updated_at/id desc; empty-query order updated_at/id desc. Title/body are plain text snippets, never trusted HTML. No results offers clear filters; failure shows retry, not an empty library. Cursor is validated against filter/query fingerprint. Concurrent edits may move results between pages; no snapshot guarantee for browsing.
8. Export: save pending edits before exporting, or explicitly export the last saved version. Single export returns body bytes as UTF-8 .md; title goes in a safe filename, not injected into Markdown. Bulk export returns one consistent read snapshot of owned active notes. No raw HTML processing or remote fetch occurs.
9. Trash: confirm Move to Trash, capture expected revision, then increment revision and set UTC deletion/expiry. Remove from active UI/search immediately after commit. Owner may restore strictly before purge_after; at equality/after expiry return EXPIRED. Restore increments revision and returns to the active list. Purge and restore lock/check the same row so one wins safely. A stale save cannot update a trashed note. Dedicated Trash errors never expose other accounts.
10. Logout/account switch: clear private client caches and editor buffers after dealing with unsaved changes; protected calls verify sessions again. Unsaved buffer is memory-only; browser/process loss can lose unsaved text and the UI must not promise otherwise.

## Import/export fidelity

Import previews filename-derived title and decoded Markdown in an escaped text view; then creates a note with no collection/tags unless explicitly selected. Same filename never overwrites. Each deliberate repeated import creates a new note; transport retries with the same mutation ID do not. No archive import, frontmatter interpretation, embedded image download or PDF/Word parsing.

Proposed ZIP entries: sanitized title plus note UUID suffix and .md extension, no directories or path traversal, deterministic collision handling. Bulk export contains raw Markdown bodies only; collections/tags, revisions, timestamps, preferences, Trash and chat are not included. Explain this limitation before download. It is portable note text, not a full account backup. Use an evaluated ZIP streaming library only during authorized implementation; syntax/design documentation does not install it.

If a note changes after the export snapshot, the export includes its snapshot version. If deleted during streaming, bytes already sent cannot be recalled; clearly state snapshot time. Auth is checked before transfer and no public persistent download URL is created. Streams abort cleanly on client disconnect where possible; failed streams are not reported as complete. Snapshot duration/connection cost must pass load tests under host limits.

## Data invariants and transactions

- Application user identity is unique by trusted issuer/subject; never identify ownership from a submitted email/ownerId.
- Composite owner/id foreign keys prevent cross-owner collection/tag associations. Every read and mutation also checks owner server-side.
- Notes carry revision, deleted_at, purge_after and server timestamps. Updates require active state and expected revision. Search derives from the same committed note data, not AI indexing.
- Create/import and write quota/account usage updates share a transaction; storage uses byte length, not character count. Serialize per-account budget reservation to prevent races. Purging releases storage exactly once.
- Idempotent mutations use unique (owner_id, operation, mutation_id), payload fingerprint and stored result. Same ID/different payload returns VALIDATION; rollback does not leave a success receipt. Retain receipts for a proposed 24 hours; the client must not automatically retry after that window.
- Receipt replay happens only after current authorization/lifecycle checks; it must not return cached note content after Trash or expiry. Receipts hold identifiers/revision/status, not full private bodies.
- Permanent physical purge is bounded and idempotent. Scheduling is unresolved, and must be specified before release. Expired notes cannot be restored even if cleanup has not run. Historical AI excerpts and account erasure remain separate policy gaps.

## Security and nonfunctional requirements

Use safe Markdown rendering with raw HTML disabled or a vetted sanitizer. Restrict link protocols, avoid unsafe DOM insertion and protect external new-tab links. Validate UUIDs, revisions, limits, filters and associations on the server. Cookie-authenticated writes require correct origin/CSRF protections. Use private/no-store responses; logs record request IDs/timing/error codes, never note bodies, OAuth credentials or exported data.

Responsive editor uses split preview on desktop and Edit/Preview tabs on mobile. Labels, focus restoration, dialog keyboard support, reduced motion, visible focus and 320px/200% zoom behavior must pass review in all appearance combinations. shadcn/ui is a foundation, not proof of accessibility.

Proposed measured targets: warm save/search p95 under 1 second on a documented 200-note test account; cold auth/database starts measured separately; local typing must remain responsive with max-size notes. Record hardware/region/concurrency for results. Performance targets are not guarantees until validated.

## Acceptance and test matrix

| ID | Scenario | Required result |
|---|---|---|
| WF-01 | New/returning Google login; duplicate callbacks | One stable user mapping; no invite restriction |
| WF-02 | Consent cancel, invalid return path, expired session | Safe error/return; no protected write or open redirect |
| WF-03 | Two users, known IDs at all boundaries | Generic missing/denied; no content/metadata leak in read, mutation, search, Trash or export |
| WF-04 | Create retry and same ID/different payload | One draft; payload mismatch rejected |
| WF-05 | Edit while save pending; save acknowledgment races | Latest local text stays dirty until acknowledged; no false Saved |
| WF-06 | Two tabs update same revision | One wins; other preserves buffer and resolves explicitly |
| WF-07 | Delete races autosave; restore races expiry/purge | No implicit revival; atomic deadline/state checks |
| WF-08 | Collection/tag removal while editing | Notes remain; revision changes; stale association update fails |
| WF-09 | UTF-8, emoji, NUL, binary, traversal filename, size boundary | Correct byte limits and safe rendering/filenames; no partial import |
| WF-10 | Import retries; deliberate second import | Retry creates once; deliberate import creates another note |
| WF-11 | Search text/filter combination and pagination | Only owned active matches; bad cursor rejected; failure distinct from no results |
| WF-12 | Script/unsafe links in Markdown and snippets | No script execution or unsafe navigation |
| WF-13 | Single/bulk export with duplicate titles and concurrent edits | Safe unique filenames; saved/snapshot fidelity; no Trash/cross-user data |
| WF-14 | Concurrent writes near count/storage/rate ceiling | Atomic limit enforcement; no paid escalation or partial writes |
| WF-15 | Restore before/exactly at/after 7 days | Before succeeds; equality/after fails; owner check always applies |
| WF-16 | Repeated purge after partial failure | Bounded cleanup; no double budget decrement/dangling sources |
| WF-17 | Keyboard/mobile/zoom/theme and logout switching | Reachable actions, preserved focus/privacy and no previous account state |
| WF-18 | Export disconnect, dependency outage, migration failure | Honest failure state; saved-data/export validation; no disaster recovery claim |

Use unit tests for normalization/validation and export filenames; PostgreSQL integration tests for ownership/revision/budget/idempotency races; end-to-end tests for the signed-in journey and critical UI failures. No tests have run because no application exists.

## Definition of ready and implementation sequence

The feature contracts are reviewable, but auth SDK/limits and transaction driver selection still need verification. Proposed thresholds/ZIP packaging require implementation review. Public release additionally requires global quota values, purge trigger, account-deletion policy and deployment eligibility checks. AI availability is not a dependency of this workflow.

Once implementation is explicitly authorized: (1) scaffold selected stack and shared tokens; (2) integrate Google auth/user mapping and isolated database migrations; (3) implement note save/conflict and organization; (4) add search and transfer; (5) implement Trash/purge and run the matrix. Each task gets its own verification; this ordering does not authorize application work.

## Current scope decision — 2026-11-10

Owner deferred application-managed backups and disaster recovery to a future milestone, outside MVP. Backup hosting remains undecided; no service is selected. The approved 24-hour RPO and seven-day encrypted backup retention apply to that future capability, not MVP guarantees or release gates. Existing provider history is incidental, not a promised recovery service. MVP keeps Markdown import/export, seven-day note Trash/restore, immediate account-deletion access blocking and live-data removal targeted within seven days. Cleanup required for those features remains in scope. This decision supersedes earlier backup/restore release gates in this document. No disaster-recovery guarantee is offered for MVP.
