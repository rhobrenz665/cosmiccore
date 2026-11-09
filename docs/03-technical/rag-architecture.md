# RAG architecture

Status: Proposed detailed design | Updated: 2026-11-10

## Scope and components

Online free-API inference is current scope; Ollama/Qwen ~7B is future scope. Hosted provider/model and tokenizer are not selected. One Next.js server owns authorization, retrieval, prompt assembly, generation/persistence and source access; PostgreSQL owns private source versions/chunks. No separate vector database, web fetcher, MCP executor or worker service is required by this proposal. See [provider options](ai-provider-options.md) for evidence and privacy constraints.

Source inputs: active owned note title/Markdown and saved-reference title/description/URL. A bare URL is metadata, not the page content; tell users that chat cannot summarize an unfetched page. Exclude notes in Trash and deleted references. Search/retrieval failures must not become ungrounded generation. Scope selected by owner ID comes from the verified server session, never client claims.

## Ingestion and version lifecycle

1. Saving source content increments revision and atomically marks derived state pending; no inference call in save transaction. Ordinary PostgreSQL note/reference search remains usable without embeddings.
2. In an explicit bounded indexing request, acquire a lease for source+revision, normalize extraction consistently, preserve headings/code/source offsets and compute versioned content hashes. Markdown is parsed as text; no remote image/link downloads or HTML execution.
3. Proposed chunks: heading-aware paragraphs, approximately 400 tokens with up to 50-token overlap; split oversized code/text safely. Preserve source title and section labels; tokenize against the selected configuration before making size claims. Exact sizing is an evaluation parameter, not a fixed approved model property.
4. Write a staged chunk version. Before activation, verify source still owned, active and at expected revision. Atomically activate only a complete version; otherwise discard stale work and leave current pending state. Readers never mix revisions. Failed/expired leases are retryable by explicit authenticated indexing or bounded maintenance.
5. Delete/Trash removes source eligibility immediately, regardless of asynchronous indexing/purge. Restore/revised source requires current chunks before it re-enters RAG. Content hash reuse is scoped to the same owner and embedding configuration; no cross-user cache that exposes private equality.

Proposed initial batch: at most 5 sources or 100 chunks per request with a bounded deadline. Very large notes may need sequential chunk batches and completion checks. Show pending/failed state in source UI with Retry indexing; no background completion guarantee after request termination. Freeze admission when quota/storage fails and preserve original notes. Cleanup stale staged versions through bounded maintenance.

## Retrieval stages

Initial candidate: owner-scoped PostgreSQL lexical full-text retrieval over current chunks. Use the same explicit simple configuration as the first workflow where appropriate. Bound query length, candidates and context using the [chat specification](../04-features/ai-chat/spec.md). Rank title/heading/body; deduplicate near-identical overlap and cap chunks per source to improve diversity. Stable tie-breaking uses source/chunk IDs.

Lexical-only RAG lacks semantic/paraphrase recall. It may be sufficient for a measured first release, but cannot be declared equivalent to vector search. Empty lexical matches produce insufficient evidence, not a silent provider-only answer. Candidate caps should be SQL-side after owner/version/state filtering, not global retrieval followed by client-side filtering.

Conditional next stage: choose one embedding model/dimension and validate pgvector availability, supported index/operator, storage and recall. Combine bounded lexical and vector candidates using evaluated rank fusion, without assuming score scales are comparable. No extra reranker/model call initially. Chat-model changes do not reindex; incompatible embedding-model changes require a new versioned space, staged rebuild, validation then atomic active-config switch. Never compare vectors from incompatible spaces.

## Context, security and freshness

Server maps S1…Sn labels to authorized chunk IDs/source versions; prompt includes only selected bounded excerpts and instructions to acknowledge missing/conflicting evidence. Keep untrusted source text structurally separated from instructions. No tool permissions, secret access, remote URLs or executable actions are granted by source content. Conversation assistant text is not independent evidence.

Reauthorize and validate current revision/state immediately before transmission and before final success; source-view endpoint rechecks on every access. Changes can race with an external request: bytes already sent to provider/browser cannot be revoked. Mark invalidated generations incomplete/source-changed rather than claiming a current grounded answer. Do not present a newer source revision as historical evidence for an older answer.

Source excerpt snapshots support inspection but are private retained content; conversation retention/deletion policy is now owner-approved in the chat specification. Existing generated prose is not automatically redacted by source deletion. Account blocking applies to source snapshots and attempt status endpoints too.

## Failure and operation boundaries

- Save committed / indexing failed: note remains saved; indexing retry shown.
- No eligible sources / no matches: clear no-evidence result, no inference token charge.
- Retrieval unavailable: explicit retryable error, no general-knowledge fallback.
- Model/quota unavailable: preserve question, no silent model/provider/paid switch.
- Interrupted generation: partial output incomplete, reservation conservatively reconciled.
- Source deleted while work runs: late indexing/finalization cannot resurrect it.

Use request IDs, timings, candidate/chunk counts and usage counters in logs; never prompt bodies/source text. Metrics distinguish retrieval recall failures, provider errors and persistence failures. Local development can use deterministic stubs and synthetic data. Backups remain future scope; indexing can be rebuilt from source records but does not recover lost source data.

## Quality and readiness

[Evaluation plan](../06-testing/rag-evaluation.md) defines synthetic scenarios and Proposed thresholds. The hosted provider, embedding strategy, runtime token accounting and measured latency/cost remain unverified. Do not provision pgvector, call models or install a SDK based on this document alone; application implementation is still unauthorized.
