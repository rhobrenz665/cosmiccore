# BUILD-04 — Markdown notes and organization step plan

Status: BUILD-04 MVP feature acceptance complete; spoken screen-reader and staging checks deferred post-MVP | Updated: 2026-11-15

This plan breaks BUILD-04 into reviewable steps following the [approved scope](../01-product/mvp-scope.md), [first-workflow specification](../04-features/first-workflow/spec.md), and [service contracts](../04-features/first-workflow/contracts.md). Work proceeds one step at a time. After each step, report the behavior implemented, files changed, validation performed, and remaining decisions; wait for direction before starting the next step. BUILD-04.1 through BUILD-04.4 are implemented in source. Signed-in local acceptance covered core note editing/conflicts, collection/tag flows, two-account isolation, global and note-byte quota rejection/recovery, shared database quota/retry races, responsive layouts, and keyboard traversal. Spoken screen-reader and target-host checks are deferred post-MVP.

## Scope

Implement private Markdown note creation, listing, reading, editing, preview, debounced autosave, explicit revision conflicts, and flat collections/tags. Keep owner identity session-derived and all reads/writes inside existing private database boundaries and mutation receipts. No Trash/purge, search, import/export, references, AI, account deletion, offline durability, global-cap selection, deployment, or role provisioning is included in BUILD-04.

Production global capacity decisions remain Proposed. Temporary development values are configured in ignored `.env.local` for local acceptance; they do not constitute production approval. Mutation handling fails closed when global values are missing. See [operational gates](../07-deployment/build-03-operational-gates.md).

## Steps

### BUILD-04.1 — Private note create, list, and read

**Deliverable:** A notes index with empty/loading/error states, explicit Create Note action, owner-scoped note list, and authorized `/notes/[noteId]` read. A GET to `/notes/new` must not create a row. Create uses a client-generated mutation ID; retries with the same ID must resolve through the existing receipt.

**Acceptance:** A signed-in owner creates one blank note and sees it in the list; refresh returns the saved note; missing, malformed, trashed, and cross-owner IDs disclose no content; duplicate action retry creates no second note; signed-out requests cannot create/read. No other account's title, body, tags, or collection metadata appears.

### BUILD-04.2 — Editor and safe Markdown preview

**Deliverable:** Controlled title/body editor, Edit/Preview tabs on mobile, readable preview on desktop, collection/tag controls initially read-only, title/body validation, byte count, empty and maximum-size states, and explicit focus-mode exit. Preview escapes raw HTML and allows only safe link protocols.

**Acceptance:** Preview updates from the current buffer without a server write; empty Markdown is usable; UTF-8 byte limits and title code-point limits match the server; script tags, event attributes, and unsafe URL schemes do not execute or navigate; 320px width and keyboard/mobile Edit/Preview controls remain usable.

**Implementation choice:** Selected `react-markdown` 10.1.0 because the app had no Markdown renderer. Its official project documentation states that raw HTML is escaped or ignored by default and warns against weakening URL handling; the editor uses `skipHtml`, an allowlisted URL transform, external-link protections, and alt text instead of fetching remote images. No rich-text editor or GFM plugin was added. See the [official security guidance](https://github.com/remarkjs/react-markdown#security), checked 2026-11-15.

### BUILD-04.3 — Serialized autosave and revision conflict handling

**Deliverable:** One-second debounce, one in-flight save per editor, same mutation ID for retrying an unchanged uncertain request, a follow-up save for edits typed during a pending request, visible Dirty/Saving/Saved/Error states, preserved local text on failure, and before-unload warning while unsaved.

**Acceptance:** “Saved” appears only after the current buffer is acknowledged; network/quota/rate failures preserve all local text; retry does not duplicate or charge twice; two tabs saving the same revision produce a conflict; the losing editor retains its buffer and shows the latest authorized server version. “Use server version” warns before discarding local text; “Save my version” clearly confirms overwrite against the newest revision and can conflict again.

**Implementation note:** The save uses the existing receipt/quota transaction, checks the owner-scoped active note revision under a row lock, and applies content, generated storage-byte accounting, updated timestamp, and revision bump atomically. An uncertain request keeps its mutation ID and payload until reconciled. If a retry receipt has expired, the action loads the latest authorized note and presents a version choice instead of silently issuing a fresh mutation. Implementation is present; acceptance is not yet tested.

### BUILD-04.4 — Collections, tags, and associations

**Deliverable:** Create/rename/delete flat collections and tags; select one collection and up to 20 tags per note; case-insensitive NFC name uniqueness; quotas and idempotent mutations; owner-scoped association checks. Deleting a collection unassigns notes; deleting a tag removes associations; both bump affected note revisions so stale editors cannot revive associations.

**Acceptance:** Foreign-owner IDs fail generically; duplicate normalized names fail safely; collection/tag delete preserves notes and increments affected revisions once; stale save receives a conflict; repeated retry does not double-change counters; count/byte/rate boundaries reject atomically. Global-cap values remain unset until explicitly chosen.

**Implementation note:** Note assignments participate in the same revision-controlled save as title/body. Collection and tag create/rename/delete use the existing private mutation receipt/quota transaction and database NFC/case-insensitive uniqueness. Deletion preserves notes, clears collection/tag associations, and increments affected note revisions in the same transaction. The manager retries uncertain requests with the same mutation ID. Source is implemented; acceptance has not been exercised.

### BUILD-04.5 — Feature acceptance handoff

**Deliverable:** Review the complete notes journey against the applicable first-workflow scenarios, record what was actually exercised, inspect the final diff and links, and update `PROJECT_STATUS.md` with completed steps, open decisions, and the next smallest milestone.

**Acceptance:** No step is called complete based only on a successful build. Manual database evidence must identify the environment and include synthetic-fixture cleanup. Do not claim target-host, concurrent-tab, hostile-Markdown, global-cap, or accessibility acceptance unless those checks were actually performed. Do not commit, push, deploy, provision, or select provider capacities as part of this plan.

**Handoff result — 2026-11-15:** `npm run typecheck`, `npm run lint`, `npm run test:mutation-rules` (3 tests), `npm run test:connection-lifecycle` (6 tests), and `npm run build` passed before signed-in acceptance. Signed-out HTTP smoke checks returned 200 for `/` and redirected `/notes` and `/notes/new` to sign-in. Temporary development-only global caps were added to ignored `.env.local` to exercise live mutations; they are not production decisions. In an authenticated local session, created and edited a synthetic note, verified autosave and persisted reload in a second tab, exercised a stale-revision conflict and both explicit resolution choices, and confirmed raw hostile HTML was absent from the rendered Markdown preview. Created a collection and tag, assigned both to the note, then deleted them; the note remained and its associations were cleared. The exact synthetic note was subsequently removed in one transaction with its account/global lifetime note counters adjusted; receipt and minute-rate rows remain subject to normal expiry. The empty-state and new-note copy was corrected to describe the implemented editor.

**Two-account isolation result — 2026-11-15:** Used separate Google identities in separate browser sessions. Created a unique synthetic note in each account. Each account's notes list omitted the other account's title/body, and direct requests for the other account's note returned only the generic unavailable page. Removed both exact synthetic notes and reconciled their account/global lifetime note counters atomically; both workspaces were left without these test fixtures.

**Global note-cap rejection result — 2026-11-15:** With only the local development `COSMICCORE_GLOBAL_NOTES_COUNT_LIMIT` temporarily set to `0`, submitted the blank-note creation flow from an authenticated local session. The server returned “Storage or resource limit reached,” kept the user on the new-note page, and created no note. Restored the ignored local setting to `500` immediately after the check. This verifies one global note-count rejection path; it does not verify concurrent global capacity races or per-account quota/retry-receipt failure and replay behavior.

**Responsive and keyboard result — 2026-11-15:** Checked the signed-in note editor at 320, 375, 768, and 1024 CSS pixels. The document had no horizontal overflow at any checked width; the 320/375 layouts showed 44px Edit/Preview controls and only the selected panel, while 768/1024 showed the desktop two-column editor. At 320px, keyboard traversal showed visible focus and reached both view controls, labeled Title/Markdown/Collection fields, and the tag disclosure. The status region exposes `role=status` and `aria-live=polite`; mobile view controls have valid `aria-controls` targets. The browser accessibility tree exposed the expected named controls and status semantics. No note values were changed. A spoken VoiceOver session was not run.

**Note-save quota recovery result — 2026-11-15:** Temporarily set the local global note-byte cap to zero, created an empty synthetic note, and entered a unique draft. Autosave showed “Storage or resource limit reached. Your draft is still here.” and retained the full draft value. Restored the exact prior local cap; the draft remained present, and an edit triggered a successful save. Removed only this test note after verifying its exact ID, blank title, exact synthetic body, byte count, and absence of associations. Account/global note-count and byte usage were decremented atomically under the owner lock; mutation receipts and rate counters remain for normal expiry.

**Shared database quota/retry result — 2026-11-15:** The first harness attempt failed before setup committed. A scoped elevated read-only review found zero matching synthetic identities and zero reserved global rows for that run ID, confirming no fixtures remained. A fresh isolated run `fb6f8f83-4711-4c9d-a003-f88c15d6fbf3` passed concurrent account/global note-count and note-byte reservations, both account-block/write orderings, retry reconciliation after an acknowledged result was discarded and after an injected rollback, and own-session disconnect rollback/fresh retry. The harness confirmed synthetic fixture cleanup and final success.

MVP acceptance is complete for BUILD-04. The owner deferred spoken screen-reader and target-host verification until after the rest of the MVP is complete. No staging deployment is configured in this checkout. These post-MVP checks and production operational decisions remain release gates; local acceptance does not establish public-launch readiness.

Local validation rerun — 2026-11-15: `npm run typecheck`, `npm run lint`, `npm run test:mutation-rules` (3 passed), `npm run test:connection-lifecycle` (6 passed), and `npm run build` all passed. Responsive, keyboard, and mobile accessibility-tree checks are recorded above. The initial shared quota/receipt harness run `5063856e-5665-4ec7-a814-f416610c3993` failed before setup committed; a scoped elevated read-only query confirmed no fixture rows. The fresh shared reservation/retry run `fb6f8f83-4711-4c9d-a003-f88c15d6fbf3` passed and confirmed cleanup. The owner deferred spoken screen-reader and target-host checks post-MVP. No BUILD-03 completion is claimed.

## Decisions kept open

- Exact global capacity values and the behavior when global mutation capacity is exhausted; see operational gates.
- Target-host runtime, public action abuse controls, and account/migration role verification.

These do not change the agreed notes scope. Keep them Proposed until reviewed; do not silently expand BUILD-04 to close unrelated operational gates.
