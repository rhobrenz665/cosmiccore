# Backup and cleanup feasibility

Status: Backups Deferred; MVP deletion/Trash cleanup Proposed | Checked: 2026-11-10

## Verified capabilities and limits

[Neon's backup guide](https://neon.com/docs/manage/backup-pg-dump) describes logical backup/restore with pg_dump/pg_restore. The [PostgreSQL manual](https://www.postgresql.org/docs/current/app-pgdump.html) documents consistent database dumps without blocking ordinary concurrent use; database roles and cluster-wide objects require separate consideration. Select a compatible tool version, verify schema/permissions and test restoration. A successful dump exit code alone does not prove recoverability.

[Neon's history-window documentation](https://neon.com/docs/postgres/backup-restore/history-window) limits Free history to up to 6 hours or 1 GB of changes. This is useful for recent incidents, not an independent backup against project/account loss or delayed detection. A shorter recent history is not itself a worse RPO for an incident within that window; recovery coverage and independence are separate concerns.

[Vercel legacy Cron pricing](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing) permits daily Hobby invocation with per-hour scheduling precision. Function resource limits still apply. The docs label Cron Jobs legacy and direct future migration to Schedules. Schedules eligibility/pricing has not been validated here; do not assume its limits match legacy Cron or silently add a new service. Daily invocation with timing variance/failure cannot guarantee a strict 24-hour backup age.

## Recommendation

Recommendation: keep the approved 24-hour RPO as an unverified release target. For development, evaluate encrypted logical backups to operator-controlled storage outside the database account; for a public release, require dependable execution, independent storage and a tested restore. Do not claim a local laptop or best-effort daily job provides guaranteed coverage.

Reason: independent backup protects a different failure domain than provider history, while avoiding premature infrastructure purchases.

Trade-offs: existing local hardware can avoid incremental service fees but incurs electricity/availability/operating effort. Cloud runners/storage may add dependencies, quotas and privacy risk. No fully unattended $0 solution has been verified, and there is no hidden paid fallback.

MVP impact: restore validation blocks public production readiness, not feature specification. The owner must supply or approve an operational backup destination/execution method before implementation of this plan.

## Backup procedure to validate later

1. Use an isolated, access-controlled runtime with short-lived or narrowly scoped credentials; never place dump files, database URLs or encryption keys in the public source repository or public workflow artifacts/logs.
2. Produce a consistent logical archive covering app data and the necessary schema/version metadata. Validate managed auth schema restore support separately; do not assume copying rows recreates hosted auth configuration, signing material or OAuth secrets.
3. Encrypt before persisting/transferring; keep decryption recovery material separate from backup storage. Record start/snapshot/completion timestamps, schema version, size and integrity hash in a private manifest.
4. Publish/mark complete only after verified upload/storage success; preserve the previous good backup on failure. Expire by approved retention, never before confirming an adequately recent good backup remains. If retention and recoverability conflict, alert the operator rather than silently extending a privacy promise.
5. Proposed scheduling target: every 12 hours with retries and backup-age alerts before 24 hours. This is a requirement for candidate evaluation, not a configured scheduler. Monitor age using the snapshot's recovery point, not just job completion time.
6. Rehearse restoration in an isolated environment, verify ownership/counts/revisions and compatible migrations, then measure recovery time. Default account access stays blocked until post-backup deletion requests are reconciled.

Storage estimate: retained backup count × measured compressed encrypted dump size, plus temporary staging and restore capacity. Egress estimate: backups/day × monthly days × measured transferred bytes. Compare with actual plan allowances; growing data can defeat a free strategy before user-count limits do.

## Trash and account cleanup execution

Logical expiry is exact: at purge_after, no restore/read/export through Trash is allowed, regardless of physical deletion timing. Every active read/search/RAG path also excludes deleted notes immediately. This enforces the seven-day user-visible recovery policy without depending on scheduler precision.

Proposed cleanup target: purge overdue notes and completed account-deletion work in small bounded transactions. A candidate eligible daily scheduled invocation can drain batches only within measured runtime; record remaining backlog. Use a protected operator retry to handle failures. Daily schedule plus precision variance means physical deletion may occur after expiry; disclose and specify a measurable maximum before launch. Do not promise exact physical erasure at seven days.

Use an indexed deadline queue, consistent lock ordering, idempotent deletion and atomic usage decrement. Multiple invocations must be safe; SKIP LOCKED or equivalent leasing is a candidate design. Authenticate internal maintenance calls and fail closed if the secret is missing. Never accept arbitrary owner/table selectors from public input. No expensive unbounded maintenance inside ordinary page loads.

Account deletion and note expiry have separate deadlines. Provider account deletion can fail after app content is removed; persist a retryable private work record, deny app access and prevent recreating the identity mapping until completion. Verify actual provider deletion/session APIs before implementation.

## Deletion reconciliation and recovery

An independent encrypted deletion journal must preserve minimal identity/deletion requests newer than the restored snapshot. Otherwise a restore can resurrect deleted users/content. Its failure domain, retention and access are unresolved operational design requirements, not an assumed existing service. A journal restored only from the same old backup is insufficient.

Before reopening a restored environment: keep access blocked; load deletion journal; reconcile account deletions and note expiries; invalidate old sessions as supported; rebuild current indexes; run two-user isolation checks; record actual RPO/RTO. If journal completeness cannot be established, manual review is required and production restoration is not ready.

## Exit evidence

- An approved destination/executor/key recovery method with measured cost and quota use.
- Tested backup scheduling/retries/failure notification and maximum observed backup age below the target.
- Successful isolated restoration including managed auth configuration strategy and deletion reconciliation.
- Measured cleanup backlog drain capacity and physical deletion latency under failures.
- Approved backup retention and account-deletion policy (confirmed 2026-11-10), plus an agreed RTO (still unresolved). None of these runtime checks has been performed.

## Owner policy confirmation — 2026-11-10

Encrypted backup retention is approved at seven days. Account access blocks immediately on confirmed deletion; live-data removal is targeted within seven days without an account recovery grace period. Executor/storage, expiry enforcement, provider-side deletion and restore reconciliation remain unverified. These approvals do not authorize provisioning or implementation.

## Current scope decision — 2026-11-10

Owner deferred application-managed backups and disaster recovery to a future milestone, outside MVP. Backup hosting remains undecided; no service is selected. The approved 24-hour RPO and seven-day encrypted backup retention apply to that future capability, not MVP guarantees or release gates. Existing provider history is incidental, not a promised recovery service. MVP keeps Markdown import/export, seven-day note Trash/restore, immediate account-deletion access blocking and live-data removal targeted within seven days. Cleanup required for those features remains in scope. This decision supersedes earlier backup/restore release gates in this document. No disaster-recovery guarantee is offered for MVP.
