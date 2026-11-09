# Api Design

Status: Draft — specification placeholder

Draft boundary: Server Actions for note/reference/collection/tag mutations; Route Handlers for streaming chat and import/export. All operations validate session, ownership, payload size and schema. No public versioned REST API is promised.

Proposed contracts: save note accepts expected revision and returns new revision or conflict; chat accepts conversation ID and idempotency key and emits typed content/source/completion/error events. Export is owner-scoped and served as an attachment. Use bounded pagination/filter inputs. Return unauthenticated, unavailable, validation, conflict and quota errors without leaking record existence.

Pending: exact routes, request/response schemas, status codes, CSRF/origin handling for mutations, rate limits and streaming reconnect semantics. Resolve with the first vertical-slice specification.

## Proposed operation matrix

| Operation | Boundary | Required contract |
|---|---|---|
| Load own pages/search | Server Component → service | Verified session, bounded filters and stable pagination |
| Create/update/delete note | Server Action | Input schema; update revision; delete confirmation; ownership |
| Collection/tag/reference mutations | Server Action | Owner-matched relationships, validation, quota and idempotency where needed |
| Import Markdown | Route Handler | Multipart/text limits; UTF-8 validation; create-only behavior |
| Export note/bulk notes | Route Handler | Server-authorized snapshot; safe attachment filenames; bounded response |
| Stream chat | Route Handler | Conversation ownership, idempotency key, quota reservation and typed stream |
| Appearance settings | Server Action | Enumerated token values and current user only |

The exact paths are deliberately left to feature specifications. Common error envelope: code, safe message, requestId, optional fieldErrors/retryAfter. Proposed codes: UNAUTHENTICATED, NOT_FOUND, VALIDATION, CONFLICT, RATE_LIMITED, QUOTA_EXCEEDED, DEPENDENCY_UNAVAILABLE. Only return revision/conflict detail after ownership is established. A cross-owner identifier is indistinguishable from missing.

Cookie-authenticated writes require trusted-origin/CSRF handling appropriate to the selected library; Route Handlers must not assume Server Action checks apply to them. Set private/no-store policy for sensitive responses. Export uses attachment disposition. Streaming clients distinguish content, source, completed and error events; reloadable generation state handles disconnects. No token-bearing URLs.

## First workflow specification

See [workflow detail](../04-features/first-workflow/spec.md) and [concrete contracts](../04-features/first-workflow/contracts.md) for Proposed request/result shapes, data invariants, validation, concurrency, transfer behavior and acceptance scenarios. Provider SDK/configuration remains subject to verification; these documents do not provision or implement auth.
