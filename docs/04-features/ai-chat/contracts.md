# Chat and source contracts

Status: Proposed | Companion: [feature specification](spec.md)

## Server operations and routes

| Boundary                                   | Validated input                                                                 | Success                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| createConversation Action                  | mutationId, optional title                                                      | conversationId, updatedAt                                            |
| listConversations service                  | bounded cursor/limit                                                            | own summaries + nextCursor                                           |
| getConversation service                    | conversationId, message cursor                                                  | owned messages/attempts, nextCursor                                  |
| POST /api/chat                             | conversationId, submissionId, question, configuredProviderId, disclosureVersion | SSE stream with durable attempt identity                             |
| GET /api/chat/attempts/[attemptId]         | own attempt ID                                                                  | persisted state/text/checkpoint/usage estimate; no system prompt     |
| POST /api/chat/attempts/[attemptId]/cancel | mutationId                                                                      | current cancel/terminal status                                       |
| POST /api/chat/attempts/[attemptId]/retry  | new mutationId                                                                  | new attempt/stream, same question message; original must be terminal |
| GET /api/chat/sources/[sourceMappingId]    | owned mapping ID                                                                | authorized current-compatible excerpt/title/type or unavailable      |
| deleteConversation Action                  | conversationId, mutationId                                                      | immediate access removal acknowledgment; no Trash; bounded cleanup   |

Accept no client system prompts/history arrays, arbitrary provider URLs, auth keys, owner IDs or source text. Server assembles history/context. Every read/write rechecks active user and ownership; mutations require appropriate same-origin/CSRF controls. Sensitive responses use private/no-store. Missing/cross-owner returns indistinguishable NOT_FOUND.

Before stream headers, HTTP errors use the shared Result envelope: 401 unauthenticated, 404 missing/cross-owner, 400 invalid input, 409 conflict/attempt active, 429 rate/quota and 503 unavailable. Add safe domain codes AI_DISABLED, DISCLOSURE_REQUIRED, PROVIDER_UNAVAILABLE, SOURCE_CHANGED and ATTEMPT_ACTIVE. Reset/retry timestamps must reflect known quota windows; do not invent a provider reset time.

## Proposed SSE events

One JSON object per data field; monotonically increasing event sequence within the connection. Content is untrusted text. IDs are opaque server-issued identifiers.

```text
event: accepted
data: {"attemptId":"uuid","messageId":"uuid","sequence":1}

event: phase
data: {"phase":"generating","sequence":2}

event: delta
data: {"text":"A supported explanation…","sequence":3}

event: source
data: {"label":"S1","sourceMappingId":"uuid","title":"Example note","sequence":4}

event: completed
data: {"attemptId":"uuid","outcome":"completed","usageEstimated":false,"sequence":5}
```

Terminal completed outcome may be no_evidence, stored without provider inference. Errors after headers emit terminal error event with attemptId, safe code/message and sequence when connection remains writable; HTTP status cannot be changed after streaming. Network termination without terminal event is incomplete until status reconciliation. Heartbeats are optional bounded transport events, not evidence of generation/persistence.

Do not emit completed before the final database transaction succeeds. If the commit succeeds but the terminal event is lost, status reload must show completion without regenerating the response. If persistence fails, never present displayed text as durable.

The MVP uses the documented Server-Sent Events (SSE) protocol for AI Chat streaming. The server controls generation attempt lifecycle, source mapping, cancellation, and durable completion. The client must implement the corresponding SSE event contract explicitly.

Vercel AI SDK transport integration may be evaluated later. Incompatible streaming protocols must not be mixed, and automatic resumable streaming must not be assumed.

## Data implications

Conversations: owner_id, id, title, state/deleted status and timestamps. Messages: owner-matched conversation, role, body, created_at, ordering sequence and originating submission ID. Generation attempts: owning user/message, provider/model/config version, status, lease expiry, input fingerprint, quota reservation, conservative usage, checkpoint and failure code. Source mappings: owner/attempt/message, label, source document/chunk revision/hash and bounded cited excerpt under the approved retention policy.

Unique owner/conversation/submission constraint prevents duplicate messages; one-live-attempt constraint or serialized lease acquisition prevents concurrent inference. Use consistent lock ordering for user/global/provider quotas. Finalization checks account, conversation and current source validity before publishing successful answer. A late callback must not recreate a deleted conversation. All cleanup is bounded/idempotent and metadata-only logs carry request/attempt IDs, not bodies or source titles.

Conversation retention until user deletion, no-Trash deletion and preservation of existing answer text after source deletion are Approved. Schema/cleanup details remain Proposed; source snapshots are private content and count toward storage quotas. No full prompt persistence or unrestricted retrieval debug endpoint.
