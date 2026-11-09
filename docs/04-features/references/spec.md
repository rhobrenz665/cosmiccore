# References

Status: Proposed detailed specification | Updated: 2026-11-10

## Objective and stories

Save useful web and GitHub links with personal context, organize them and retrieve them without depending on AI or web crawling. As a learner I want to save a URL with why it matters; find it by title, description or tags; edit outdated context; and remove a link I no longer need.

MVP includes manual HTTP(S) URL/title/description entry, CRUD, flat collection and tags, search/filtering and grid/list views. Automatic fetching, repository cloning, screenshots, favicons fetched from remote sites, favorites, binary files, reference bulk import/export and public sharing are outside this feature contract. Note Markdown export remains unchanged.

## Main workflow

References page → Add Reference → enter URL, title and optional description → choose optional own collection and tags → Save → show new item with hostname and saved metadata. Render a shadcn/ui Dialog on desktop or Sheet on narrow screens; use labeled fields, inline errors and focus restoration. Retain form text on server errors. Save stays disabled during an in-flight submission; successful commit closes the form and updates the list/dashboard.

An existing reference opens an internal details/edit view. Open website is a separate explicit action, shows the destination hostname and uses a safe new-tab link. A saved link is not endorsed or checked for availability. Editing uses a revision check; stale edits preserve local fields and request explicit reconciliation with current authorized data. No silent merge.

## Proposed validation, URL identity and duplicate behavior

These limits/normalization choices are Proposed implementation defaults, not vendor restrictions.

- Absolute HTTP/HTTPS URLs only; maximum 2,048 UTF-8 bytes; nonempty hostname; reject embedded username/password, control characters and missing scheme. Use a standards-compliant URL parser, never regex-only scheme validation. No server request to the destination occurs.
- Title is required after trimming, 1–200 Unicode code points. Description is plain text, optional, at most 8 KiB UTF-8. Preserve internal whitespace. Zero/one owned collection; up to 20 distinct owned tags, using the organization contract.
- Store parser-serialized URL and user-visible destination. Duplicate key removes fragment, normalizes scheme/host through the parser and removes default ports. Preserve path case, trailing slash and query parameter order/values; do not strip tracking keys or equate HTTP with HTTPS. This conservative key can miss equivalent URLs but avoids merging distinct resources.
- Unique (owner_id, canonical_url_key) prevents races and duplicates within one account. Different accounts may save the same URL without learning about each other. Duplicate conflict returns only the owner's existing reference ID and offers Open existing or Edit existing; no overwrite or auto-merge. A changed URL colliding with another own record returns the same conflict.
- GitHub links remain ordinary saved URLs; optionally derive a display kind from the exact parsed github.com hostname. Do not treat lookalike hosts as GitHub or infer repository permissions/content. A fragment can be retained in the saved destination even though duplicate identity ignores it; explain the conflict and allow editing the existing destination.
- Proposed cap: 500 references and 5 MiB combined UTF-8 URL/title/description per account. Count/storage budget and mutation receipts are updated atomically. Reuse the proposed 60/min authenticated mutation budget from the first workflow. Global limits must be set from actual capacity before public launch.

If URL schemes/private-host restrictions change later with crawling, specify SSRF controls before enabling any fetch. Manual saving alone must not introduce server DNS resolution or fetching.

## Search, lists and linked knowledge

List default: updated_at descending, then id descending. Query searches title, description and saved URL text; collection and selected tags combine with AND. No network search. Empty query lists all own records. Default page 20, max 50; cursor binds to query/filters/view type. Show escaped plain-text snippets. Grid/list share filters and result ordering; mobile defaults to list as a proposal.

Links between a note and reference are explicit owner-matched relationships. Add/remove link verifies both records; no automatic backlink scraping. Trashed notes cannot be newly linked; hide their links in active-note views. Reference deletion removes associations, not the linked note. Link editing bumps the source note revision if shown as note metadata; target-reference edits do not silently change stored note body.

## Deletion and failure states

Approved reference policy (2026-11-10): confirmation followed by immediate permanent removal from the live reference library, with no reference Trash. Linked notes remain intact. Account-deletion cleanup also removes references under the approved account policy. Implementation details below remain Proposed.

On commit, remove reference/tag/link rows and invalidate current source indexing; source-view resolution must fail immediately. Historical AI excerpts follow the separate chat-retention policy, not a promise of automatic redaction. Provider embeddings must not cause source deletion to roll back or allow stale retrieval.

Empty library offers Add Reference; no-results offers Clear filters; list failure shows Retry rather than pretending the library is empty. Invalid URL shows field error; duplicates offer existing item; quotas show actionable limit message. Missing/cross-owner ID returns generic NOT_FOUND. A reference deleted while editing cannot be recreated by a stale update. Repeated delete with an idempotency key is safe after owner authorization, without exposing other users' receipts.

## Data and API implications

Saved reference: UUID, owner_id, normalized saved URL, canonical key, title, description, nullable collection_id, revision, created_at, updated_at. Composite owner/id keys and owner-matched foreign keys cover tags/links/source documents. App user active status is checked with mutations to prevent post-account-deletion writes. No auth/admin secrets reach clients.

Server Actions: createReference({mutationId,url,title,description,collectionId,tagIds}) → {referenceId,revision,updatedAt}; updateReference adds referenceId/expectedRevision; deleteReference adds referenceId/expectedRevision/mutationId and returns removed ID. Server reads: getReference and searchReferences with validated filters/cursor. Use the [shared result envelope](../first-workflow/contracts.md), extending codes with DUPLICATE_REFERENCE and owner-only existingReferenceId. URL text or descriptions must not appear in logs. Deletion policy is Approved; the service implementation contract remains Proposed.

Write note/reference content changes and source indexing invalidation in one database transaction; embedding generation is outside the transaction and outside this feature's availability requirements. Update only expected revisions, enforce unique URL key in the database, map unique violations to duplicate outcomes and roll back quota reservations on failure. Cross-owner and nonexistent tag/collection IDs must not reveal the foreign record.

## Nonfunctional requirements and dependencies

Safe text rendering and protocol-validated external links; no dangerous HTML, public caches or third-party preview requests. Keyboard-operable actions, labeled inputs and icons, predictable focus, reduced motion, mobile/zoom and both appearance modes follow the design system. Owner filtering is mandatory on every path including duplicate detection. Reference CRUD/search must work while AI is disabled. Proposed warm query/mutation p95 target under 1 second on a documented 500-reference fixture; measure rather than claim achieved performance.

Dependencies: auth/internal user mapping, organization services, relational constraints, pagination/search and accepted shell direction. No paid service or separate backend. Backups remain future scope.

## Acceptance and test scenarios

| ID | Scenario | Acceptance |
|---|---|---|
| REF-01 | Save/reload ordinary and GitHub URLs | Exact saved destination/metadata persist without remote request |
| REF-02 | javascript/data/relative URLs, credentials, oversized/control input | Server rejects and preserves safe form state |
| REF-03 | Fragment/default-port/case duplicates; concurrent create | Owner-only duplicate conflict; one record, no double quota use |
| REF-04 | Same URL across accounts; known foreign IDs | Independent records, no metadata or existence disclosure |
| REF-05 | Edit race, invalid relationships, deleted target | Conflict preserves local input; no cross-owner join or resurrection |
| REF-06 | Plain-text search + tags/collection + cursor | Relevant owned matches; no-results distinct from outage |
| REF-07 | HTML-like title/description and lookalike GitHub hostname | Escaped text; no script or false domain label |
| REF-08 | Collection/tag deletion and note links | Reference survives organization removal; deleting reference never deletes note |
| REF-09 | Quota/rate race and retry | Atomic limits and idempotency; no partial write |
| REF-10 | Confirmed immediate reference deletion | Cleanup removes source access and links; stale update fails |
| REF-11 | Mobile/keyboard/zoom and dialog errors | Reachable controls, proper focus and retained user input |

Unit tests cover normalization and limits, database tests cover uniqueness/ownership/revisions/transactions, and end-to-end tests cover capture/search/edit and confirmed immediate deletion. No implementation tests have run.
