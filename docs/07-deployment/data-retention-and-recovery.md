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

## Lifecycle and maintenance planning

See [account lifecycle](../03-technical/account-lifecycle.md) for Proposed deletion/history policies, and [backup/cleanup feasibility](backup-and-cleanup-plan.md) for validated tool capabilities and remaining operational gaps. Immediate logical expiry is distinct from delayed physical purge. The 24-hour RPO remains unverified until the backup/restore workflow is tested.

## Approved account and backup policies — 2026-11-10

Confirmed account deletion blocks access immediately and targets removal of live app data within seven days, without a recovery grace period. Encrypted backups expire after seven days. The 7-day note Trash and 24-hour RPO target are unchanged. See [account lifecycle](../03-technical/account-lifecycle.md) for remaining implementation/history decisions. Earlier references to pending account/backup-retention approval are superseded by this confirmation; runtime verification and RTO remain outstanding.

## Current scope decision — 2026-11-10

Owner deferred application-managed backups and disaster recovery to a future milestone, outside MVP. Backup hosting remains undecided; no service is selected. The approved 24-hour RPO and seven-day encrypted backup retention apply to that future capability, not MVP guarantees or release gates. Existing provider history is incidental, not a promised recovery service. MVP keeps Markdown import/export, seven-day note Trash/restore, immediate account-deletion access blocking and live-data removal targeted within seven days. Cleanup required for those features remains in scope. This decision supersedes earlier backup/restore release gates in this document. No disaster-recovery guarantee is offered for MVP.

## Approved chat retention — 2026-11-10

Conversation history remains until the user deletes it, subject to storage limits. Confirmed conversation deletion removes live access immediately without Trash; dependent content cleanup is bounded and must not be undone by late generation. Deleting a source blocks future retrieval/citation access, while existing generated answer text remains until its conversation is deleted. Account deletion overrides retention under its approved policy. Implementation details remain Proposed.
