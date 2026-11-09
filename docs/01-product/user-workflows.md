# MVP user workflows

Status: Draft — proposed behavior | Public registration/private data confirmed

## Sign-in and first use

Visitor → Google sign-in → verified server session → idempotent internal user mapping → dashboard. No family allowlist or invitation. Canceled consent returns to sign-in; callback/session failures offer retry without exposing credentials. Returning users retain their existing identity. Google OAuth production configuration and auth provider quotas are launch dependencies.

## Capture and autosave

Create blank note → type Markdown → preview safely → assign optional collection/tags → autosave with expected revision → show saved state. Blank drafts may exist, with an Untitled display label. Proposed: 1-second debounce and explicit save command sharing the same mutation; exact debounce is provisional. Serialize saves per editor; edits during an in-flight save schedule a subsequent save using the returned revision. Preserve unsaved editor text on errors.

Validation failure shows the offending field; session expiry requests reauthentication without claiming the edit is saved; stale revision shows conflict with local/server text and explicit resolution. Navigation with unsaved changes offers a warning where the browser supports it. No durable offline draft guarantee. Deleting requires confirmation and moves a note to private Trash for 7 days. The owner may restore before expiry; trashed notes are immediately excluded from normal lists/search/AI retrieval. At expiry restore is denied; bounded physical purge is specified separately. A deleted note cannot be resurrected by an older autosave request.

## Organize and retrieve

Create flat collection/tag → assign own notes/references → search query plus optional filters → page through results → open item. Empty library offers capture; empty results offer filter reset. Deleted collections unassign items, rather than deleting them. Deleted tags remove associations. Search excludes other accounts and deleted records, regardless of supplied IDs. Name normalization/uniqueness and ranking await detailed specification.

## Save a reference

Paste HTTP(S) URL → enter title/description → choose optional collection/tags → save → appear in recent items/search. No remote fetch or repository clone occurs. Duplicate URLs prompt an existing-item choice rather than a silent merge; exact normalization is a detail to specify. New-tab links use appropriate opener protection.

## Import and export

Select .md file → validate size/UTF-8/text → preview title/content → create new private note → index for search. Reject binary/malformed/oversized input without partial note creation. Filename is a suggestion, never a filesystem path. Import does not overwrite an existing note by name.

Export note → authorized saved revision → download UTF-8 .md. Bulk export → owner-scoped bounded snapshot → download archive of .md files, with sanitized unique filenames. ZIP packaging is Proposed, not an approved dependency. Show when unsaved edits are excluded. Metadata/links round-trip fidelity is not promised until the export contract is finalized; Markdown export is not a complete database backup. Large exports need measured batching or a clear limit, not an unbounded serverless task.

## Ask grounded questions

Open/new conversation → submit question → authorize and reserve quota → persist message/attempt → retrieve current own sources → stream answer and source events → finalize usage/history. Retrieval error offers retry; zero relevant results yields insufficient evidence. Incomplete output remains visibly incomplete. Cancel aborts upstream work where supported; billing may still occur and quota accounting remains conservative. Sources open only after fresh authorization. Indexing-pending notes are shown as not yet included in AI context.

## Appearance and account

Choose appearance/color preference → persist → apply consistently on future loads. Focus mode hides secondary chrome and has a keyboard-accessible exit. Logout clears account-specific client caches. Account deletion requires reauthentication/confirmation as supported, blocks further app access, then removes dependent content according to an approved deletion/backup policy. Exact retention and account-deletion implementation are release blockers.

Each flow maps to PRD requirement IDs and must gain concrete API/UI tests in its feature specification.
