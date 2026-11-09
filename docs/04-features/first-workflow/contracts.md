# First workflow contracts

Status: Proposed | Companion: [workflow specification](spec.md)

## Shared service result

```typescript
type Result<T> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; error: {
      code: 'UNAUTHENTICATED' | 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT'
          | 'EXPIRED' | 'RATE_LIMITED' | 'QUOTA_EXCEEDED' | 'DEPENDENCY_UNAVAILABLE';
      message: string;
      fieldErrors?: Record<string, string[]>;
      retryAfterSeconds?: number;
    }; requestId: string };
```

The server derives owner identity from a verified session. No operation accepts an authoritative ownerId from the client. All UUID/revision/mutation IDs are validated; revisions are positive safe integers. Conflict responses contain no other user's revision/body. The client separately loads the latest authorized active note for comparison.

## Server services and Actions

| Service/action | Input | Success data |
|---|---|---|
| createNote | mutationId UUID; optional title/body | noteId, revision, updatedAt |
| getNote | noteId UUID | title, body, collectionId, tagIds, revision, updatedAt |
| saveNote | noteId, expectedRevision, mutationId, title, body, collectionId nullable, tagIds | noteId, revision, updatedAt |
| trashNote | noteId, expectedRevision, mutationId | noteId, revision, deletedAt, purgeAfter |
| restoreNote | noteId, expectedRevision, mutationId | noteId, revision, updatedAt |
| create/renameCollection or Tag | mutationId, optional entityId, name | entityId, normalizedName, displayName |
| deleteCollection or Tag | entityId, mutationId | entityId; affectedNoteCount |
| searchNotes | query, collectionId?, tagIds?, cursor?, limit? | items, nextCursor nullable |
| listTrash | cursor?, limit? | noteId/title/revision/deletedAt/purgeAfter items, nextCursor |

Names must follow the [specification's validation rules](spec.md). Search combines selected tags with AND and collection with AND; query text is optional. Null/absent collection filter means all, not unfiled; add an explicit unfiled filter only through a later contract. Filter references are verified as owned before searching. Result snippets are plain text. Trash pagination orders deleted_at/id descending; normal notes order as described in the specification. No client arbitrary SQL/sort fields.

Single note revision includes metadata changes. No history/version restore feature is promised. Purge runs as an internal authenticated operator/scheduled task, not a publicly callable action. No unrestricted owner parameter is exposed through it.

## Proposed browser routes

- `/sign-in`, `/dashboard`, `/notes`, `/notes/new`, `/notes/[noteId]`
- `/knowledge` for eventual combined search; first slice shows notes only and says so
- `/trash` and `/settings/data` for recovery/transfer

`/notes/new` presents create UI; GET does not create a database record. A user-triggered Action creates the note and redirects after successful commit. All route reads call authorized services directly.

## Transfer Route Handlers

| Method/path | Request | Success | Errors |
|---|---|---|---|
| POST `/api/import/markdown` | Multipart: file, mutationId; optional collectionId/tagIds encoded as validated JSON | 201 JSON Result containing noteId/revision | 400 invalid metadata/encoding; 413 too large; 429 rate/quota; 401 unauthenticated; 503 dependency |
| GET `/api/notes/[noteId]/export` | Authorized noteId | 200 UTF-8 Markdown attachment | 404 missing/trashed/cross-owner; 401/503 |
| GET `/api/exports/notes` | No owner parameter | 200 streamed application/zip | 401/429/503; explicit error before headers for known limit violations |

POST import does not accept external URLs. Validate total multipart request size as well as file size, with a proposed 320 KiB request ceiling. Import creates only after validation; idempotent receipt replay returns success without duplicating. Response may use 200 on an already committed replay, with a replay indicator if needed.

Set `Cache-Control: private, no-store`, safe Content-Disposition filenames and `X-Content-Type-Options: nosniff`. Cookie-authenticated writes validate same-origin/CSRF through the chosen supported mechanism. Never accept an arbitrary redirect/export filename from query parameters. Exports are expensive reads and need separately configurable rate limits, proposed 5 bulk exports/hour/user; set global concurrency only after load measurement.

HTTP errors use the shared JSON envelope before stream headers. Once bytes have streamed, the server cannot change the HTTP status or append JSON to a ZIP; terminate the stream on failure, log a request ID without content, and let the client show incomplete download. Successful header transmission alone is not completion.

## Session boundary

Use the chosen auth SDK's documented server verifier; do not invent Google callback/token exchange or trust client session objects. After verification, resolve an internal account ID. Provider-managed callback paths remain dependent on the final integration. Google issuer/subject and auth-service user identity mapping must be verified against actual SDK fields before schema implementation.

Logout ends the supported session and clears app client state. Do not claim instant invalidation of previously issued bearer tokens without a tested provider mechanism. For this workflow, use the verified cookie session boundary consistently; test expiry/revocation at all mutation/transfer entry points.

## Data transfer shapes

Dates use ISO-8601 UTC strings; note bodies preserve decoded text and UTF-8 export bytes. Missing/trashed/cross-owner active notes return the same NOT_FOUND response. Owned expired Trash entries may return EXPIRED without source content; cross-owner restore always returns NOT_FOUND. Unknown/malformed UUID returns validation without querying unbounded data. Empty search result is a successful items=[] response, never DEPENDENCY_UNAVAILABLE.
