# AI Chat with private RAG

Status: Proposed detailed specification | Updated: 2026-11-10

## Objective and confirmed boundaries

Help a signed-in learner ask questions using their own knowledge, inspect supporting sources and revisit conversations. Stories: ask about an idea across notes; understand why an answer was given; recognize insufficient evidence; recover conversation history after reload.

MVP uses online models with verified free API access. Initial planning choice: Groq Free / openai/gpt-oss-20b; account/privacy/quality verification still pending. Local Ollama/Qwen ~7B is explicitly future scope, including hosted-to-local connections. Public Google registration never grants cross-user knowledge access. No MCP/tools, web browsing, uploads, voice, interviews, automatic quiz/rewrite workflow or paid fallback. Source text is notes and user-entered reference metadata, not fetched web pages. Backups remain outside MVP.

## Proposed user workflow

1. Open Chat. Show provider/model and availability; explain that questions and retrieved excerpts are sent to that hosted provider. Require acknowledgment of the current disclosure before the first transmission. Unavailable or unconfigured providers show an honest disabled state; notes/search still work where their infrastructure permits.
2. Create/open own conversation. New conversations use a neutral title derived from the first question (escaped/truncated), not an extra paid model call. History is ordered updated_at/id descending; page size 20, max 50. Empty state suggests asking about saved knowledge without sending a request automatically.
3. Type a question and submit. Preserve input until durable acknowledgment. Validate session, active account, conversation ownership, provider entitlement, disclosure, request limits and quotas before contacting inference. No arbitrary base URL, API key or full client-supplied conversation history is accepted.
4. Retrieve own active current sources. Display a retrieval state, not generated text pretending retrieval succeeded. No matches produces a saved insufficient-evidence response without inference; retrieval failure produces an error, not a no-evidence claim. Notes still indexing are clearly identified as excluded.
5. Assemble bounded context/history and stream generation. Show a cancel control. Text is labeled Generating until completion is durably persisted. Model-proposed citations are checked against server-mapped retrieved sources. Do not invent source cards from arbitrary URLs/model output.
6. Completion stores answer, source mappings, provider/model, outcome and usage metadata. A completed event is sent only after commit. Reload obtains persisted history/attempt state; losing the stream does not silently mark partial text complete.
7. Source selection reauthorizes current record and version. Show source title/type, cited excerpt only when still permitted, and current-source action. Trashed/deleted/changed sources show Unavailable/Changed rather than silently presenting newer text as the evidence for an old answer.
8. Provider error/rate limit/timeout leaves explicit failed or incomplete attempt; retry is an intentional user action. No automatic provider switch or blind replay of a partially generated answer. New generation attempt reuses the original user message and records a separate attempt ID.

## Proposed limits and service behavior

These are conservative application defaults for evaluation, not vendor quotas or approved performance guarantees.

| Resource | Proposed bound |
|---|---|
| Question | Nonblank; max 8 KiB UTF-8, then max 1,024 model tokens |
| Concurrent work | One live generation per user and conversation; global concurrency configured before enabling provider |
| Request quota | Initial 10 generation requests/user/day; global budget derived from verified provider free allowance |
| Output | Max 768 completion tokens, lowered to provider allowance; include hidden/reasoning usage if billed/reported |
| Input | Max 6,000 tokens total including instructions, history, question and sources; provider-specific lower limit wins |
| Retrieval | At most 20 owner-scoped candidates; at most 5 distinct selected chunks and 3,000 context tokens |
| History sent upstream | Last 4 completed user/assistant turns, bounded to 1,000 tokens; omit incomplete attempts |
| Deadlines | Proposed 15 seconds retrieval/preflight, 30 seconds first provider token, 90 seconds total; abort upstream when supported |
| History storage | Proposed 100 conversations and 2 MiB stored message/source text per user; refine from measured usage |

Exact provider accounting, tokenizer and reasoning limits must be verified before enablement. All prompt parts are budgeted together; truncate optional history/source count before compromising immutable system instructions. If the question itself does not fit the selected model, return validation. No automatic summarization call to stretch context. Storage and request budgets are enforced transactionally; no UI-only limits. No claim of unlimited AI for public users.

## Grounding and source semantics

Mode is knowledge-grounded Q&A. Without evidence, ask for relevant notes or offer normal search; do not silently answer from general model knowledge. For partial evidence, answer only supported parts and identify missing information. Conflicting sources should be presented as conflicting, with both cited, rather than silently picking a fact.

Instructions and untrusted source content are separated; sources cannot request credential disclosure, tools, network access or altered ownership checks. Previous assistant prose is conversational context, never primary evidence for a new answer. Prior source snippets are not blindly replayed: revalidate source state and omit stale/deleted evidence before provider transmission.

Use server-generated labels S1…S5 with exact chunk IDs and versions stored with the attempt. Streamed citation markers are provisional. At finalization, map only known labels; strip/mark unknown labels as unsupported and do not emit a successful grounded status for fabricated source IDs. Citation ID validity is not entailment: the UI must not claim automatic fact verification. Human evaluation checks claim support.

Before sending context and before emitting persisted success, recheck selected source ownership/current revision/deletion and account/conversation state. If invalidated mid-generation, abort or mark interrupted/source-changed and suppress normal completed status. Already sent provider/browser bytes cannot be recalled; document this limitation. Historical account-private assistant text may already include excerpts; its retention policy is defined below.

## Persistence, idempotency and cancellation

Persist user message, attempt, selected configuration and atomic quota reservation before upstream work. A unique (owner_id, conversation_id, submission_id) receipt prevents duplicate user messages on transport retries. Same ID/different payload fails validation. A lease/heartbeat and request deadline bound active attempts; an expired lease is reconciled by a later authenticated request or bounded maintenance task. No guaranteed background continuation is assumed.

State machine: accepted → retrieving → generating → completed; terminal alternatives: no_evidence, failed, canceled, interrupted. Provider response with zero text is not a successful answer. Cancellation is owner-scoped and best effort upstream; mark partial text incomplete, charge conservative usage when uncertain, and never refund tokens merely because the browser disconnected. Do not hold a database transaction while streaming.

Persist partial output in bounded batches only if within configured write budget; target max 2-second or 1-KiB checkpoints, not one write per token. A terminated invocation may lose text since the last checkpoint. A live duplicate request returns existing attempt identity, not a second provider call. It need not reattach to an ephemeral stream; the client reads persisted status and offers explicit retry only after terminal resolution. Provider idempotency is not assumed.

Reservation locks per-user/global budgets in consistent order. Reserve worst-case bounded input/output, settle actual usage when reliable, retain conservative reservation for uncertain outcomes and record estimated=true. Pre-inference no-evidence can release token reservation but still consumes an anti-abuse request allowance. An upstream 429/unknown failure does not prove zero usage. Retry uses a new attempt/reservation after the original is terminal; no paid fallback.

## Error/empty states and accessibility

Distinct states: no conversation; no indexed sources; indexing pending; no relevant evidence; search/database error; privacy acknowledgment required; AI disabled; quota exhausted with reset information; provider/model unavailable; timeout; cancellation; interrupted stream; save failure; stale/deleted source; account access revoked. Preserve already saved questions and user draft where appropriate. Never display raw provider errors, prompts, secrets or another user's identifiers.

Desktop has history pane, message stream, source panel/sheet and composer. Mobile history/sources use labeled shadcn/ui Sheet/Dialog; composer stays reachable above the keyboard. Use controlled scrolling, accessible status announcements for phase/completion (not every token), keyboard send with multiline alternative and an announced Stop generation action. Render Markdown safely; no active raw HTML or unsafe links. Shared tokens support Cosmic/Minimal and light/dark/system; no local model picker in MVP.

## Approved conversation and historical-answer policies — 2026-11-10

Owner approved retaining conversations until deleted by their owner, subject to storage quotas. Confirmed deletion immediately removes the conversation from live views, with bounded dependent-data cleanup and no chat Trash. A source deletion blocks citation views and future retrieval, but existing generated answer text remains until its conversation is deleted. Explain that distinction and offer conversation deletion for that text. These product policies are Approved; cleanup implementation remains Proposed. Account deletion overrides history and follows the approved immediate-block/seven-day live-removal policy. Do not advertise stronger erasure until specified/tested.

## Dependencies and acceptance matrix

Depends on session/account authorization, notes/references lifecycle, versioned ingestion/retrieval, transactional budgets, chosen free provider/disclosure, adapter and safe streaming persistence. Lexical retrieval can be an initial evaluated RAG baseline; embeddings/vector search are conditional, not required to make inference useful. Quality evidence must decide readiness.

| ID | Scenario | Acceptance |
|---|---|---|
| CHAT-01 | New/open history, replay submission | One user message/active attempt; stable owned pagination |
| CHAT-02 | Foreign IDs and source labels | No read/write/status/citation leak across accounts |
| CHAT-03 | Provider not configured/disclosure missing | No outbound inference; actionable state |
| CHAT-04 | No relevant evidence versus retrieval error | Distinct saved no-evidence response versus retryable error; no invented answer |
| CHAT-05 | Supported/conflicting/partially supported claims | Mapped sources; missing evidence/conflict explicit |
| CHAT-06 | Fabricated citation or injection source | Unknown citation not trusted; no tools/secret disclosure |
| CHAT-07 | Source edited/trashed/deleted during generation | No normal grounded completion; rechecked citation access |
| CHAT-08 | Cancel, disconnect, runtime death | Partial result incomplete; no duplicate call/refund assumption |
| CHAT-09 | Concurrent requests near global/user budgets | Atomic reservation and concurrency limit; no overspend fallback |
| CHAT-10 | Provider 429/timeout/empty stream/final DB failure | Honest terminal state, conservative usage, intentional retry |
| CHAT-11 | Reload after terminal/expired lease | Completed output durable; incomplete attempts reconciled safely |
| CHAT-12 | Account/conversation deleted while active | New access blocked; no re-created history on late completion |
| CHAT-13 | Context/token/storage boundaries | Validated limits; no hidden summarization/model switch |
| CHAT-14 | Mobile/keyboard/screen reader and hostile Markdown | Reachable composer/sources, safe rendering, useful announcements |
| CHAT-15 | Historical source unavailable | No obsolete citation text exposed; retention behavior matches approved policy |

Provider stubs validate deterministic failure/stream behavior in CI; database tests verify leases, quotas and isolation; small consented/synthetic live evaluation measures grounding and latency separately. No application/provider tests have run. The [contracts](contracts.md) and [RAG architecture](../../03-technical/rag-architecture.md) specify technical boundaries. Provider selection, cleanup implementation and quality targets remain open before implementation readiness.

## Initial provider profile

[Hosted model selection](../../03-technical/hosted-model-selection.md) selects the initial planning model and overrides generic bounds with Proposed conservative pilot caps: 4,000 input tokens, 1,536 completion tokens including reasoning, 24 global/5 per-user provider attempts per day, 150,000 global tokens/day and one global active request. These overrides remain Proposed until measured. No automatic provider/paid fallback.
