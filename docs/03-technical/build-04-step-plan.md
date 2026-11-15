# BUILD-04 — Markdown notes and organization step plan

Status: BUILD-04.3 implemented; validation pending; remaining steps Proposed | Updated: 2026-11-15

This plan breaks BUILD-04 into reviewable steps following the [approved scope](../01-product/mvp-scope.md), [first-workflow specification](../04-features/first-workflow/spec.md), and [service contracts](../04-features/first-workflow/contracts.md). Work proceeds one step at a time. After each step, report the behavior implemented, files changed, validation performed, and remaining decisions; wait for direction before starting the next step. BUILD-04.1 through BUILD-04.3 are implemented in source; runtime/acceptance testing remains pending.

## Scope

Implement private Markdown note creation, listing, reading, editing, preview, debounced autosave, explicit revision conflicts, and flat collections/tags. Keep owner identity session-derived and all reads/writes inside existing private database boundaries and mutation receipts. No Trash/purge, search, import/export, references, AI, account deletion, offline durability, global-cap selection, deployment, or role provisioning is included in BUILD-04.

Global capacity settings remain blank and fail closed. Code may be implemented without inventing values, but database-backed mutations cannot be accepted live until the owner/operator chooses all seven global values. See [operational gates](../07-deployment/build-03-operational-gates.md).

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

### BUILD-04.5 — Feature acceptance handoff

**Deliverable:** Review the complete notes journey against the applicable first-workflow scenarios, record what was actually exercised, inspect the final diff and links, and update `PROJECT_STATUS.md` with completed steps, open decisions, and the next smallest milestone.

**Acceptance:** No step is called complete based only on a successful build. Manual database evidence must identify the environment and include synthetic-fixture cleanup. Do not claim target-host, concurrent-tab, hostile-Markdown, global-cap, or accessibility acceptance unless those checks were actually performed. Do not commit, push, deploy, provision, or select provider capacities as part of this plan.

## Decisions kept open

- Exact global capacity values and the behavior when global mutation capacity is exhausted; see operational gates.
- Target-host runtime, public action abuse controls, and account/migration role verification.

These do not change the agreed notes scope. Keep them Proposed until reviewed; do not silently expand BUILD-04 to close unrelated operational gates.
