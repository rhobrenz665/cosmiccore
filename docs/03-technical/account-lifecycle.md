# Account lifecycle and historical data

Status: Account deletion and backup-retention targets Approved; conversation policies Approved; implementation Proposed | Updated: 2026-11-10

## Confirmed product policies and remaining proposals

Google registration is public; all knowledge remains private. Account deletion is distinct from seven-day note Trash. Owner approved on 2026-11-10: an explicitly confirmed deletion request blocks app access immediately, with permanent removal of live app content targeted within seven days and no account recovery grace period. Encrypted backups are retained for seven days and then expired. These are product policies/targets; implementation, provider deletion and reliable backup expiry remain unverified.

Approved historical conversation policy: chats remain until the user deletes them or the account; confirmed conversation deletion has no Trash and removes live access immediately. Deleting a conversation removes its messages, source mappings and app-stored excerpts through bounded retryable cleanup. Reference deletion is separately approved as immediate removal after confirmation without Trash; linked notes survive. No new product choices should be inferred from notes-only retention approval.

A trashed note cannot be retrieved or cited through source views. Previously generated messages may already paraphrase/quote it; hiding the citation does not erase that text. Owner approved retaining existing generated answer text until its conversation is deleted. Inform users of this distinction and let them delete affected conversations; account deletion removes both. Do not promise selective automatic redaction of arbitrary generated text without an approved design.

## Session blocking and deletion workflow

1. Settings explains data scope, export option, effect on account access and backup expiry; require typed confirmation and a fresh supported Google/session confirmation. Validate provider reauthentication capabilities before choosing exact API parameters.
2. Verify current session and account; atomically set lifecycle status deleting, requested_at, target deadline and unique deletion operation ID. Pending/in-flight writes must lock/check the same user status in their transaction so they cannot commit after the deleting transition. Return an acknowledgment only after durable intent.
3. Every protected boundary checks current app account status server-side, independently of provider session-data cache. Reject new note/search/export/chat access once deleting. Abort streams where possible; bytes already delivered cannot be recalled. Never return cached private content after a fresh access check fails.
4. Request provider session revocation/user deletion using its supported API. The current [Neon SDK reference source](https://github.com/neondatabase/neon-js/blob/main/packages/auth/NEXT-JS.md) lists session/user methods, but presence is not proof of allowed managed configuration, timing or immediate JWT invalidation. Exact method support and fresh-auth requirements remain implementation gates.
5. Execute bounded idempotent cleanup of notes including Trash, references, organization, links, chunks, messages, source snapshots and preferences. Reconcile attempts/usage safely; retain minimal deletion journal/audit metadata under an approved retention policy, not original content.
6. Keep identity mapping denied until provider cleanup finishes; a failed/partial operation retries without reopening access. A returning Google identity must not automatically create a new app account while its deletion is pending. Owner approved re-registration as a fresh empty account only after prior app/provider deletion completes; no previous data is restored. Pending deletion still blocks re-registration.

Auth-owned tables must not be dropped or mutated as ordinary application records. Cross-provider and app database deletion is not one distributed transaction: use a persisted state machine (requested → blocked/cleaning → provider pending → complete, with retryable errors). Record safe error metadata and operation IDs, never private bodies or tokens.

## Backup and privacy boundaries

Approved backup retention: backups expire seven days after snapshot time, not seven days after every deletion. A pre-deletion backup can temporarily retain data until its normal expiry. Independent deletion journal reconciliation is mandatory before restoring service. No routine user read of backups, selective recovery of deleted accounts, or indefinite emergency retention is assumed. The exact provider restore/snapshot expiry and independent backup guarantees require validation.

The [backup and cleanup plan](../07-deployment/backup-and-cleanup-plan.md) owns executor/storage/restore feasibility. The already approved 24-hour RPO does not specify RTO; uptime, incident response and recovery time remain unresolved.

## Acceptance and verification

- Account B cannot request deletion, inspect progress or restore account A.
- CSRF, stale/replayed confirmation and absent fresh authentication cannot initiate deletion.
- Concurrent save versus deletion transition is serialized; no post-block content write or automatic identity recreation.
- Provider outage leaves account blocked with retryable work; app cleanup retries safely.
- Logout/browser cache clearing is tested independently of server access denial and provider JWT revocation.
- Backup recovery reapplies deletion requests newer than the recovery point before enabling access.
- Note Trash does not restore account-deleted notes; deleted/expired citation resolution fails.
- Test the disclosed distinction between source deletion and historical generated excerpts.

See [approved note policy](../07-deployment/data-retention-and-recovery.md) and [release gates](../07-deployment/release-readiness.md).

## Current scope decision — 2026-11-10

Owner deferred application-managed backups and disaster recovery to a future milestone, outside MVP. Backup hosting remains undecided; no service is selected. The approved 24-hour RPO and seven-day encrypted backup retention apply to that future capability, not MVP guarantees or release gates. Existing provider history is incidental, not a promised recovery service. MVP keeps Markdown import/export, seven-day note Trash/restore, immediate account-deletion access blocking and live-data removal targeted within seven days. Cleanup required for those features remains in scope. This decision supersedes earlier backup/restore release gates in this document. No disaster-recovery guarantee is offered for MVP.
