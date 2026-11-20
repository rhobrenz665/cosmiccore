# BUILD-06 — Reference capture, edits, and links

Status: BUILD-06.1–06.6 implemented locally, signed-in acceptance pending | Updated: 2026-11-20

## Objective and boundary

Allow each signed-in account to manually save, organize, edit, open, link, and permanently remove its own HTTP(S) references. A reference is user-entered metadata, not fetched website content. Build on the existing private account, mutation, quota, collection/tag, note revision, and design foundations. Do not add web crawling, favicon/preview fetches, files, public sharing, or AI indexing in this build.

The owner-approved deletion policy is immediate removal from the live reference library after confirmation, without Trash; linked notes survive. The detailed validation limits, canonicalization, and capacity values in the [reference specification](../04-features/references/spec.md) remain proposed until reviewed. Implementation is governed by the repository's documentation-first authorization boundary.

## Dependencies and preflight

- BUILD-03 private ownership, mutation receipts, transaction/quota coordination, and database schema.
- BUILD-04 notes, collections/tags, and revision-aware association handling.
- BUILD-05 note lifecycle predicates where a reference-to-trashed-note relationship could otherwise be created or exposed.
- [References specification](../04-features/references/spec.md), [API design](api-design.md), [database design](database-design.md), [MVP scope](../01-product/mvp-scope.md), and [design system](../05-design/design-system.md).
- Before implementation, review the schema for existing reference/link/tag tables and identify necessary reviewed migrations. Confirm what quota rules apply; do not infer that proposed 500-reference/5-MiB limits are approved.
- Keep URL writes offline from the destination: no DNS lookup, HTTP request, redirect resolution, preview, or remote favicon.

## Feature sequence

### BUILD-06.1 — Data/service contracts and URL validation

**Deliverable:** Resolve or explicitly carry forward proposed URL length, metadata limits, canonical identity rules, reference capacity/accounting, search fields, and note-link representation. Document create/read/update/delete/list/link inputs and results; owner checks; revision/idempotency semantics; transaction boundaries; and migration impact. Add pure validation/normalization only after the inputs are approved for implementation.

**Acceptance:** Every unresolved choice is visibly Proposed with an owner/technical decision point. Requirements distinguish saved destination from duplicate key; only same-owner duplicate details may be returned. A changed URL colliding with an owned record cannot overwrite it. No destination network access is part of save.

**Review handoff:** Show the schema/API delta and choices before implementing UI or applying migrations.

### BUILD-06.2 — Capture, list, and detail

**Deliverable:** Private References page with empty/loading/error states; create form in responsive Dialog/Sheet; bounded owner-scoped list; detail view with explicit safe “Open website” action. Retain values and show actionable field/quota/duplicate errors. Display a parsed hostname as text, not fetched metadata.

**Acceptance:** REF-01, REF-02, REF-04, and relevant REF-11 cases: valid HTTP(S) entries persist/reload; invalid schemes, credentials, control characters, and over-limit values fail server-side; same URL can be independently saved by two accounts; known foreign IDs reveal no existence or fields. No external request occurs during save/render. Keyboard focus returns correctly after closing the form.

### BUILD-06.3 — Edit and organization

**Deliverable:** Revision-checked editing for URL/title/description and owned collection/tag assignment using existing organization services. Preserve local form state on validation, quota, or dependency failure. Duplicate collision offers opening/editing the existing owned reference; never merges silently.

**Acceptance:** REF-03, REF-05, REF-07, and REF-08: simultaneous equivalent creates commit at most one same-owner record and charge once; cross-owner identical URLs remain independent; stale edits return an authorized conflict and preserve the draft; invalid/deleted/foreign organization IDs fail without disclosure; HTML-like text renders as text; deleting a collection/tag does not delete a reference; changed revisions and storage usage remain atomic.

### BUILD-06.4 — Explicit note links

**Deliverable:** Add/remove links between an owned active note and owned reference. Expose authorized linked references from note views and linked notes from reference detail if specified by the approved contract. A reference title/description edit must not mutate note body. A trashed note cannot gain a new link; existing links are hidden in active-note views while the note is trashed.

**Acceptance:** REF-08 and ownership cases: cross-owner links fail generically; deletion of either endpoint cannot leave a usable dangling association; note content remains intact when its reference is deleted; concurrent link/delete operations serialize or produce a safe unavailable result. If link metadata participates in note revision, increment the note revision once in the same transaction, consistent with the approved contract.

### BUILD-06.5 — Search and filtering

**Deliverable:** Bounded owner-only reference search over the approved fields, collection/tag filters, stable cursor pagination, and list/grid presentation using the shared knowledge UI conventions. Until BUILD-07, do not imply cross-type note/reference search is available.

**Acceptance:** REF-06 and REF-11: filters combine as specified; equal sort timestamps paginate without duplicates or omissions; invalid cursors fail safely; empty results differ from query failure; foreign data never appears; mobile, keyboard, zoom, and accessible labels/focus are usable.

### BUILD-06.6 — Confirmed permanent deletion

**Deliverable:** Confirmation followed by owner/revision-checked, idempotent removal of the reference, tag/link associations, and any live source-access state that exists. Notes survive. Stale edits cannot recreate the deleted reference. Deletion makes retrieval/source access ineligible immediately; no reference Trash is added.

**Acceptance:** REF-10: cancel has no side effect; confirmation removes the item and links atomically; linked note remains readable and unchanged; replay does not delete another state or reveal foreign receipts; stale update returns generic unavailable/conflict; concurrent link/delete cannot restore access. Any later RAG source cleanup must not be added unless its separate implementation contract is in scope.

### BUILD-06.7 — Acceptance and close-out

**Deliverable:** Review implementation against REF-01–REF-11, run only the checks authorized for the active testing model/environment, record database/browser environment and synthetic-fixture cleanup, inspect docs/links/diff/status, and update `PROJECT_STATUS.md` with evidence, gaps, unresolved decisions, and the next smallest milestone.

**Acceptance:** Report what was exercised and what was not. Include concurrency, owner isolation, quota rollback, safe text/protocol handling, revisions, deletion, and UI empty/error states in evidence. Do not claim authenticated wrapper, target-host, assistive-technology, or performance verification unless actually run. Do not deploy or provision as part of this plan.

## Shared workflow and safety requirements

- Keep work feature-by-feature with a review handoff at each step; user preference from BUILD-05 was 6.1 Sol Medium for implementation and a different selected model for tests. Confirm the current testing model before a test run; model selection is controlled by the user.
- Derive account identity from the server-verified session. Every reference, duplicate lookup, collection/tag relation, note link, cursor, and mutation receipt must be owner-scoped.
- Validate all input on the server. Use URL parser semantics, escaped plain text, safe external-link attributes and explicit host display. Never render stored title/description as HTML.
- Keep persistence, associations, revision changes, quota reservations, and idempotency receipts atomic where they describe one mutation. A failed mutation must not consume quota or leave partial links.
- Do not log raw URLs, titles, or descriptions. Sensitive responses are private/no-store. Do not add browser caches shared across accounts.
- Proposed limits in the source spec are not launch capacity decisions. Missing required global settings must retain the existing fail-closed behavior.

## BUILD-06.1 contract review

Status: Proposed. These recommendations are ready for owner review. The earlier approval of permanent reference deletion remains in effect.

### 1. Validation and accounting

- Retain the existing schema and policy defaults: 2,048 UTF-8 bytes for the URL, 1–200 Unicode code points for the trimmed title, 8 KiB UTF-8 for the description, at most 20 distinct owned tags, and zero or one owned collection. Normalize missing description to the empty string. Reject NUL and malformed Unicode before database writes. Reject duplicate tag IDs after UUID case normalization.
- Retain 500 references and 5 MiB of saved URL, title and description bytes per account. These are independent caps, so the byte cap can be reached before the count cap. Count the serialized, stored values using the same formula as the generated `storage_bytes` column. Reserve +1 and the full byte size on create, the signed byte difference on edit, and −1 and the stored size on permanent deletion. Link and organization-only changes have zero content-byte delta. Use the shared 60/minute account mutation default and existing global quota checks. Environment-specific global capacity remains open.

### 2. URL identity and search

- Validate an absolute HTTP(S) authority URL with a nonempty host and no user info. Reject raw controls before trimming or parsing so parser cleanup cannot silently accept them. Enforce the UTF-8 cap on submitted input, parser-serialized destination and canonical key because serialization can expand the string. Display the parsed hostname and preserve the fragment in the saved destination.
- Derive the duplicate key by clearing the fragment from the serialized URL. Use parser normalization for scheme, host and default port. Preserve the resulting path case, non-root trailing slash, query values and query order. Keep HTTP and HTTPS distinct. Save and render without DNS resolution, previews, or destination requests. The unique owner/key index remains the final authority. Map a violation of that index after rollback to an owner-scoped lookup and disclose only the matching owned ID if it still exists. If it disappeared in the meantime, return a retryable conflict.
- Search title, description and saved URL using PostgreSQL lexical full-text search with the explicit `simple` configuration. Treat user input as plain text, with no wildcard or query operators. Users can search URL words, but arbitrary partial-URL matching is outside this proposal. Discover items by collection and by all selected tags, combined with AND. Cap trimmed query text at 200 code points. A blank query lists owned references. Use a default of 20 and maximum of 50 rows with descending `(updated_at, id)` order. Keep the cursor timestamp at database precision and validate its owner and query/filter context. Grid and list share the same results. Measure the bounded owner query before adding a dedicated search index.

### 3. Schema and service interfaces

The checked-in schema and migration already define `references`, `reference_tags`, and `note_references`, including the unique URL key, revisions, generated byte count, owner-matched foreign keys, and join indexes. Reuse that shape. The reviewed contract needs no new migration on a database with the checked-in migrations applied. Migration state still needs verification in the approved test environment. No source-index rows are introduced by BUILD-06. Removing the live reference makes source resolution ineligible. A later indexing build must enforce that rule before retrieval.

Extend the existing owner-scoped data module for bounded reads using `withPrivateData`. Use a server-only reference service through `withPrivateMutation` for writes. Derive identity from the session and reuse the association checks, removing their dependence on the note-specific tag limit when parameterizing them for references.

| Operation | Request | Success |
| --- | --- | --- |
| Get reference | Reference ID | Saved metadata, organization IDs and revision |
| List/search references | Query, optional owned collection and tag IDs, limit and cursor | Projected rows and nullable next cursor |
| Create reference | Mutation ID, URL, title, optional description, collection ID or null, and tag IDs | Reference ID, revision and update time |
| Update reference | Same fields plus reference ID and expected revision | Reference ID, new revision and update time |
| Delete reference | Reference ID, expected revision and mutation ID after UI confirmation | Removed reference ID |
| Read linked items | Active note ID or reference ID, limit and cursor | Bounded owned references or active notes and nullable next cursor |
| Set note link | Note ID, reference ID, desired linked state and mutation ID | Both IDs and the acknowledged linked state |

- Use the existing shared result envelope. Missing, foreign and inactive endpoints return generic unavailable results. A stale owned reference revision returns a conflict and preserves the user's draft. Invalid filters and associations fail validation without exposing foreign rows. Keep reads private and omit reference metadata from logs.
- Treat links as a separately managed relationship with explicit add/remove commands, outside note autosave. The proposed commands do not increment note or reference revisions. Serialize them through the shared mutation core and recheck both endpoints with owner scope and active-note state. Adding an existing link or removing an absent link is a successful no-op. Trash hides links in both directions, and restore reveals surviving links. Purge and permanent reference removal use existing foreign-key cascades. Link views refresh after mutation, and saved note text remains intact.
- Reuse the mutation core's owner lock, active-account check, quota reservations and metadata-only receipt transaction. Retry uncertain writes with the same operation, mutation ID and payload. Recheck current owner and resource access on replay. A successful delete replay can acknowledge its owned metadata receipt after the row is gone. For link receipts, encode desired state in the operation and bind the pair through the payload fingerprint. Replay acknowledges that command without reapplying it. Refresh the link view to display current state.
- Keep the content write, tag changes, revision, storage delta and receipt in the same transaction. During organization deletion, collect affected reference IDs before detaching associations and advance those references' revision and update time in that transaction. The existing organization service detaches references today without that revision update. A stale reference edit must therefore conflict after this service change, including when only a tag was detached.

## Owner review and runtime checks

- Accept or revise the three recommendations above. Confirm local acceptance scope and whether target-host checks are needed. Keep global capacity and any later indexing changes Proposed.
- Verify parser expansion, fragment/default-port equivalence, same-owner collision on edit, distinct paths/queries, multibyte quota boundaries, rollback, organization revision changes, link retry and Trash/restore behavior when tests are authorized. Measure query latency on a representative 500-reference account before making performance or indexing decisions.

## Explicitly outside BUILD-06

Remote page/favicon fetching, automatic metadata extraction, GitHub repository inspection/cloning, screenshots, binaries, reference import/export, sharing, web crawling, search across notes and references (BUILD-07), and RAG indexing/generation (later AI builds). A saved URL by itself grants no authority to fetch or reveal the destination.

## Implementation checkpoint — 2026-11-20

- BUILD-06.1–06.2 cover validation, capture, library, and detail. The library now uses a filter-bound cursor with 20 rows per page. A removed or nonmatching anchor has a first-page recovery path.
- BUILD-06.3 reuses the capture form for editing. It retains the input on stale revisions and makes adopting a newer revision explicit. URL collisions link to the owner's existing record. Collection and tag removal update affected reference revisions in the same transaction.
- BUILD-06.4 provides paginated note selection on reference detail and linked-item views in both directions. Link commands check both endpoints, reuse mutation receipts, and leave note content and revisions intact. Trashed notes are excluded from both views.
- BUILD-06.5 uses plain-text PostgreSQL lexical search with the `simple` configuration. Collection and selected tags combine with AND. List and grid use the same ordering.
- BUILD-06.6 uses browser confirmation and a revision-checked transaction. Deletion releases count and byte usage and existing foreign keys remove the links and tags. Retry acknowledgements use private mutation receipts. BUILD-06 adds no source index.
- The existing schema supports these changes. The proposed application limits and existing fail-closed global quota handling apply. No production capacity was selected.

## Smallest next milestone

Run BUILD-06.7 signed-in acceptance against the confirmed development database with temporary quotas and two test accounts. Exercise REF-01–REF-11, including content persistence, owner isolation, query/tie pagination, stale edits after organization detachment, removal and retry, concurrent quota/write behavior, Trash/restore links, no destination traffic, and keyboard/mobile flows. Record precise fixture cleanup and measured evidence before treating the feature as accepted.
