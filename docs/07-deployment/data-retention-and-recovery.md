# Note Trash and recovery policy

Status: Approved product targets; implementation Proposed | Date: 2026-11-10

## Confirmed decisions

Deleted notes stay in private Trash for 7 days and can be restored during that period. They disappear immediately from normal lists, full-text search and AI retrieval. The recovery point objective (RPO) for a major failure is at most 24 hours of lost committed changes. This is a target, not a verified backup capability or availability guarantee.

## Proposed implementation contract

- Soft-delete sets server-generated deleted_at and purge_after (deleted_at + 7 × 24 hours in UTC), increments revision and invalidates indexing atomically. Every active-note read/write/search/retrieval checks deleted_at is null. Older autosaves cannot revive a trashed note.
- Owner-scoped Trash lists show expiry and restore action. Restore checks ownership and the deadline atomically, clears deletion fields, increments revision and schedules reindexing. If its former collection/tag no longer exists, restore without that association.
- After expiry, reject restore even if physical cleanup has not run. A bounded idempotent purge removes the note and derived content. Exact cleanup trigger/schedule and physical deletion latency must be validated against $0 hosting; an in-memory timer is insufficient. Trash consumes storage until purged.
- Citation resolution must reject trashed/purged sources. Historical messages may already contain excerpts; historical chat retention and erasure are separate unresolved decisions. This note policy does not approve account, reference or conversation retention.
- Normal export excludes Trash; proposed separate owner-triggered export of a recoverable trashed note must be specified if needed. Markdown export alone is not a full database backup.

## Backup and disaster recovery

Select and validate a $0 mechanism capable of meeting the 24-hour RPO: consistent backup/restore coverage, secure independent storage, scheduling, failure alerts and retention. Provider restoration alone must be checked against actual plan limits. A daily job with no failure detection may miss the RPO. No package installation or provisioning is authorized by this document.

Define recovery time objective (RTO), backup retention/encryption/access, and auth-data restoration with the selected managed provider before release. Restore drills must verify ownership, counts, note revisions and migration compatibility in an isolated environment. Restoring a backup must reconcile deletion deadlines and post-backup deletion requests before serving users; expired/deleted data must not silently reappear. Backup expiry and account erasure policy remain to be decided.

## Acceptance cases

1. Delete hides a note from lists/search/RAG immediately while retaining it in the owner's Trash.
2. Another account cannot list, restore, read or export it.
3. Restore before expiry succeeds; at/after expiry fails, including races with purge.
4. Stale autosave after deletion fails; restore creates a new revision and reindexes current content.
5. Purge can retry without dangling associations or retrieval exposure.
6. An isolated restore drill demonstrates a recoverable point no more than 24 hours old; a missed target is reported and blocks claiming RPO compliance.

See [release readiness](release-readiness.md) and [database design](../03-technical/database-design.md).
