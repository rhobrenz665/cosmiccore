# Database Design

Status: Draft — conceptual design

Proposed entities: users, notes, references, collections, tags, note_tags, reference_tags, knowledge_links, conversations, messages, source_documents, chunks, generation_attempts and quota_usage. Tables are conceptual, not final DDL. Avoid a workspace/membership abstraction until sharing requirements justify it.

User-owned rows carry owner_id; foreign keys and composite uniqueness must prevent links across owners. Index owner_id with common updated_at/filter fields; use PostgreSQL full-text indexes after representative query planning. UUID keys and UTC timestamps are proposed. Notes carry an optimistic revision; chunks carry source revision, content hash, embedding model and dimension. Message source mappings must reference the exact retrieved version.

Transactions cover note/tag updates and indexing invalidation; quota reservations and request idempotency must be atomic. External inference runs outside transactions. Choose driver/transaction APIs before schema implementation. Migration/restore policy: see deployment architecture. Pending: exact cardinalities, cascade/retention policy, RLS defense-in-depth, pgvector extension/dimension validation, ER diagram and workload indexes.

## Proposed cardinalities and constraints

[ER diagram](../02-architecture/diagrams/data-model.md). Use `app_users` for domain users, keyed by internal UUID with unique authenticated issuer/subject mapping. Managed auth tables remain provider-owned. Each note/reference has zero or one collection; each collection holds many items. Tags are many-to-many through explicit join tables. No shared workspaces or memberships are needed.

Notes: id, owner_id, collection_id nullable, title, Markdown body, revision, created_at, updated_at. References: id, owner_id, collection_id nullable, URL, title, description, timestamps. Collections/tags: id, owner_id, normalized name and timestamps; normalized-name uniqueness is proposed per owner. User preferences hold appearance and color scheme. Knowledge links use explicit note/reference foreign keys with exactly one target kind, or separate link tables; avoid unchecked polymorphic IDs.

Give owned entities unique (owner_id, id) keys and use matching composite foreign keys for joins, collection assignment, conversation messages, chunks and source mappings. Every server-side database operation involving user-owned data must enforce ownership using the authenticated user's internal ID. Ownership must be checked for reads, inserts, updates, deletes, and relationships between records. Client-provided owner IDs must never be trusted as authorization evidence. Existence checks must not disclose another user's data. Parameterize SQL; no unrestricted generic repository exposed to browser input.

Source documents use nullable note_id/reference_id with exactly one populated and uniqueness on each source. Chunks include source revision, ordinal, text hash, text, embedding metadata and readiness. Old chunks are not retrieval candidates after source updates. Message sources retain immutable citation mapping while access resolves against current authorization; snapshot retention/deletion policy is unresolved.

Use `(owner_id, updated_at, id)` for recent/keyset queries, owner/name indexes for organization, join indexes in both traversal directions, and an evaluated GIN search index. Start full-text search without a vector index; validate supported pgvector dimension/operator and representative recall/latency before adding approximate indexing. Language/tokenizer configuration is unresolved.

## Transaction and deletion boundaries

Atomically update a note with `WHERE owner_id = session_owner AND revision = expected_revision`, increment revision and invalidate derived indexing. Keep full-text search current with the committed record. Delete tag associations with tags; deleting a collection unassigns its items in the same transaction. Source deletion immediately excludes derived content. Note deletion must defeat stale autosaves. Confirmed: soft-delete notes into 7-day Trash with deleted_at/purge_after and revision increment; restore is owner-scoped and deadline-checked. Expired notes are purged through bounded idempotent cleanup. Historical citation retention remains unresolved.

Quota reservation locks shared usage rows in consistent order to enforce user AND global ceilings atomically. Idempotency keys are unique per owner/operation; attempt leases allow reconciliation after terminated requests. RLS is potential defense-in-depth, not a claimed implemented protection; transaction-local identity and pooled-role behavior must be tested before relying on it.

Review generated migrations, run on isolated data, and use expand/contract changes. Avoid a database connection/transaction spanning AI calls. [Deployment plan](../07-deployment/deployment-architecture.md) owns migration and recovery operations.

## First workflow specification

See [workflow detail](../04-features/first-workflow/spec.md) and [concrete contracts](../04-features/first-workflow/contracts.md) for Proposed request/result shapes, data invariants, validation, concurrency, transfer behavior and acceptance scenarios. Provider SDK/configuration remains subject to verification; these documents do not provision or implement auth.

## Driver recommendation

The [integration validation](auth-integration-validation.md) proposes Neon Pool/Client with Drizzle neon-serverless for interactive transactions required by quota/revision/idempotency workflows. This remains Proposed and requires runtime verification; do not assume an HTTP-only driver supports interactive callback transactions.

## Reference identity and Dashboard reads

Proposed reference additions: canonical_url_key with owner-scoped uniqueness, optimistic revision and indexed owner/update ordering. Canonicalization deliberately preserves query/path distinctions; see the [reference contract](../04-features/references/spec.md). Reference deletion is confirmed immediate after confirmation, without Trash; linked notes survive. Dashboard reads only bounded projected fields and optionally counts using the same indexes; no new summary/activity table. Note/reference relationship creation enforces owner matching.

## Detailed grounded-chat baseline

See [AI Chat specification](../04-features/ai-chat/spec.md) and [chat contracts](../04-features/ai-chat/contracts.md) for Proposed source mapping, request/stream/persistence behavior, concurrency/quota reservations and acceptance tests. Online free-API models are current scope; local Ollama/Qwen integration remains future scope. Provider/model, history-retention policies and runtime quality remain unresolved.
