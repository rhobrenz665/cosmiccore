# Initial system design

Status: Draft

Save flow: validate session and input → enforce ownership → compare expected revision → write note/revision and mark indexing pending atomically → acknowledge save. Indexing failures never discard saved text. A stale revision returns a conflict and preserves the editor's unsaved content.

Chat flow: authorize conversation → reserve quota atomically → persist user message and generation attempt → retrieve owner-scoped current chunks → assemble bounded context → stream response → persist result and source mapping. Mark interrupted attempts incomplete; retries use an idempotency key and do not duplicate user messages. Never hold a database transaction open during a model call.

Deletion flow: immediately exclude deleted documents from retrieval; remove derived chunks and indexes; enforce authorization again on citation resolution. Historical quotations may retain private text: deletion/retention behavior must be decided before release.

Trust boundaries: browser input, remote providers, imported Markdown and retrieved content are untrusted. Escape/sanitize rendered content, restrict URL protocols, keep credentials server-side, and treat source text as data rather than tool instructions. MVP AI cannot execute tools.

Operational risks: concurrent autosave, provider timeouts, exhausted quotas, cold starts, stale indexing, partial streams and failed migrations. Instrument metadata-only request/error/latency/usage counters. Define performance targets after a representative workload; use pagination, bounded queries and limited context from the outset.
