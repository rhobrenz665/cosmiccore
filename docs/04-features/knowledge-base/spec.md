# Knowledge Base and combined search

Status: Proposed detailed specification | Updated: 2026-11-10

## Objective and user stories

Give the signed-in learner one private view of their notes and saved references, organized by flat collections and tags. As a learner I want to find an idea without remembering its content type; filter a collection or topic; distinguish a note from a saved URL; and navigate safely to the source.

Confirmed: separate private accounts, flat collections/tags, note Trash and immediate reference deletion. This specification completes PLAN-01 from the [implementation backlog](../../01-product/implementation-backlog.md). It extends mixed search without regenerating the existing [notes workflow](../first-workflow/spec.md) or [References specification](../references/spec.md).

## Scope and dependencies

MVP: unified list/grid, note/reference type filtering, collection/tag filtering, text search, clear/reset, stable pagination, collection/tag entry points, and links to individual resource workflows. No folders/nesting, sharing, favorites, graph, semantic-search guarantee, bulk destructive actions or external crawling. RAG retrieval is separate and must not be implied by ordinary search quality.

Dependencies: verified session/active account, note/reference CRUD, owner-matched collections/tags, shared search configuration, database constraints and accepted shadcn/ui shell. Notes and references remain independently useful without AI. Backups/local AI remain future scope.

## Main workflow

Open Knowledge → inspect recent mixed resources → optionally enter query and choose type/collection/tags → submit → view a paginated list/grid → open an internal note/reference details page. References have a distinct external Open website control; selecting the result title opens its internal details, not an unexpected external tab.

Defaults: empty query, all types, all collections, no tags, most recently updated first. Nonempty query defaults to relevance. Show visible type labels, collection, tag labels and updated time. Note excerpt comes from saved Markdown-derived plain text; reference excerpt comes from the user's description, not fetched page content. All result content is escaped; no trusted HTML highlights.

Use explicit search submit/Enter initially rather than a request on every keystroke; changing a filter applies immediately and clears pagination. Browser Back/Forward restores URL query/filter/sort state. Native links preserve modified-click behavior. View mode is a display preference, not a query identity change.

## Filter, ranking and pagination contract

| Input | Proposed behavior |
|---|---|
| q | Trim query boundary whitespace; max 200 Unicode code points; empty means browse |
| type | all, note or reference; unknown values rejected |
| collectionId | Optional owned UUID; absent means all, including unassigned resources |
| tagIds | Up to 20 distinct owned UUIDs; resource must contain ALL selected tags |
| sort | recent or relevance; relevance with empty query resolves to recent |
| limit | Default 20; maximum 50 |
| cursor | Opaque bounded server-generated continuation; bound to normalized query/filter/sort fingerprint |
| view | list or grid; responsive default proposed as list on mobile, grid on wide screens |

Collection/type/tag filters combine with AND. No unfiled-only or OR-tag filter is assumed. Reject a supplied nonexistent/cross-owner collection/tag as a generic unavailable filter without exposing another owner's names. A valid owned empty collection produces no results, not an invalid-filter error. Offer Clear filters for stale URL filters after deletion.

Build normalized search projections for each type with the same PostgreSQL text-search configuration and field weights: title weight A, note headings weight B, note body/reference description weight C, reference URL weight D. Strip presentation markup but retain searchable code/text. Exact tokenizer/configuration is Proposed as simple to match the first workflow; language/morphology quality must be evaluated.

Combine eligible owner-scoped type queries through one result projection before final global order/LIMIT. Do not independently take a full page of each type and concatenate. A note's large body can rank differently from a short reference; one common ranking formula and normalization must be chosen/tested, not assumed inherently fair. Proposed rank is PostgreSQL rank with document-length normalization; tie-break by updated_at DESC, kind ASC, id DESC. Kind order is fixed note before reference. Query relevance is an ordinary text-search score, not confidence or factual correctness. Do not show synthetic percentages.

Recent order is updated_at DESC, kind ASC, id DESC. Keyset continuation uses the complete ordering tuple; relevance cursor includes exact server rank representation. Cursor values are type/range validated and opaque to clients; include/validate query fingerprint and cursor version. Never permit cursor data to override session owner or SQL structure. Changing query/filters resets cursor. Browsing is not a snapshot: updates may move items between pages; refresh resets the list. Export has separate snapshot semantics.

## Data/service contract

Server Components call searchKnowledge(sessionContext, {q,type,collectionId,tagIds,sort,cursor,limit}). No browser ownerId. Return the shared Result envelope with `{items,nextCursor,appliedFilters,sort,asOf}`. No total-hit count is required; do not run an unbounded exact count just to label a page.

Discriminated item shapes:

- Note: `{kind:'note',id,title,excerpt,collection,tagSummaries,updatedAt}`. ID identifies an owned active note; empty title displays Untitled consistently.
- Reference: `{kind:'reference',id,title,excerpt,collection,tagSummaries,updatedAt,hostname,url}`. URL must already satisfy reference validation; hostname is derived from the parsed stored destination.

Project bounded fields, not full Markdown/description blobs. Proposed excerpt limit: 240 Unicode code points, preserving safe text. Avoid per-result association queries: fetch bounded associations for selected IDs in owner-scoped batches or aggregate them safely. Use the same result union for standalone type views where practical; respect their feature-specific mutation contracts.

Indexes and ownership conditions follow [database design](../../03-technical/database-design.md): owner/update/type keys, text-search indexes and association indexes. Search sees only committed current active note/reference fields. Filter notes with deleted_at IS NULL before rank/limit; references disappear on confirmed deletion. Search must not depend on chunk/embedding readiness. App account status is checked before data access.

Proposed performance target: warm service p95 under one second on a fixture with the proposed 200-note/500-reference user ceilings at documented concurrency/region. Measure query plans and mixed ranking; no latency guarantee exists yet. Cap runtime/page size, do not issue remote requests or LLM calls.

## Organization and linked knowledge

Create/rename/delete collection/tag uses existing owner-scoped mutation contracts and normalized naming rules. Deleting a collection unassigns resources; deleting tags removes associations without deleting resources. Association changes increment the relevant resource revision so an open editor cannot unknowingly reintroduce stale metadata. Collection/tag filter chips show display names only after owner verification.

Manual links navigate to accessible current records. Links to notes in Trash and deleted references are hidden/unavailable in active views; known IDs do not bypass lifecycle restrictions. Collection cards may show bounded/exact counts only if implemented efficiently; a failed count is not zero. No new analytics/event table.

## UI, failure and validation states

Use shadcn/ui Input, Select/Combobox as appropriate, Sheet for mobile filters, ToggleGroup for grid/list, DropdownMenu for actions and labeled pagination controls. Avoid custom inaccessible checkbox/tag pickers when primitives fit. Maintain visible query/filter labels and selected state; clear icon has an accessible name. Results announce page updates without moving focus unexpectedly.

- Empty account: explain notes/references and offer New Note, Save Reference and Markdown Import.
- No matches: preserve query/filter state and offer Clear filters; never imply saved content was deleted.
- Search outage: explicit retry and request ID, not empty results. A combined query failure is an error, not an incomplete list silently presented as complete.
- Invalid/stale filter or cursor: safe error; reset page/filter action; no leaking ownership details.
- Resource changes after load: open safely handles missing/trashed content and refreshes the list.
- Long titles/tags, 320px width and 200% zoom: wrap/reflow controls; provide full labels without hover-only access. Distinguish types by text/icon, not color alone.
- Session expiry/account deletion: deny data; return to appropriate authentication/status flow; clear prior account client results.

Cosmic/Minimal changes surfaces, not result structure or data. Keyboard order, reduced motion and contrast follow the shared design system. UI filter state may be in URL; private query strings can enter browser history, so never place note body/credentials in navigation URLs or analytics.

## Security and acceptance tests

| ID | Scenario | Required result |
|---|---|---|
| KB-01 | Mixed note/reference query with equal scores/times | One globally ordered page; deterministic complete tie-break |
| KB-02 | Type/collection/multiple-tag filters | AND semantics match URL state and server results |
| KB-03 | Empty query and relevance sort | Recent browse behavior; no query parse failure |
| KB-04 | Trashed/deleted resources; indexing pending | Exclude deleted content; active content searchable without RAG indexing |
| KB-05 | Two users with identical names/known filter IDs/cursors | No foreign results, labels, counts or metadata |
| KB-06 | Page size/cursor/tampered sort/oversized query | Bounded validation; no arbitrary SQL/owner scope |
| KB-07 | Next page, Back/Forward, view toggle, concurrent edit | Contractual order/state; no duplicate type-concatenation bug; no snapshot promise |
| KB-08 | Delete collection/tag while filter/editor open | Resources survive; safe stale-filter state and revision behavior |
| KB-09 | Malicious Markdown/title/query/URL text | Escaped snippets, safe links, no script/highlight injection |
| KB-10 | Empty account/no matches/database failure | Three distinct states with useful actions |
| KB-11 | Keyboard/mobile/zoom/all appearance modes | Reachable labeled controls and non-color type distinction |
| KB-12 | No AI/provider/network service | Search functions without model calls or web crawling |

Unit tests cover filter/query/cursor validation; PostgreSQL integration tests cover combined ordering, rank/tie-break and isolation; end-to-end tests cover query/navigation/errors. Ranking acceptance uses a small annotated mixed corpus; tune weights only with evidence. No code or tests have run.

## Ready conditions

Core product behavior is reviewable as Proposed. Before implementation, accept unified ranking/cursor strategy, verify search-driver query support and apply existing field/quota limits consistently. The subsequent Settings specification does not block defining this search contract. Embedding selection, local AI and backups do not block ordinary Knowledge Base search.
