# Operational audit and retention

Status: Seven-day operational-metadata retention Approved; implementation Proposed | Updated: 2026-11-10

## Purpose and scope

Retain enough operational evidence to diagnose failures, enforce quotas and finish deletion safely without storing user content in diagnostic logs. This plan concerns the app-controlled MVP, not a legal-compliance guarantee or an implemented logging service. Provider-managed retention is separate and must be checked during authorized setup.

Backups, disaster recovery and independent restoration journals remain future scope. Operational cleanup records are not backups and cannot reconstruct notes or chats. The approved note/chat/reference/account deletion policies remain authoritative; this document does not silently extend their content retention.

## Proposed data categories

| Category | Allowed information | Proposed retention |
|---|---|---|
| Diagnostics | Random request ID, operation name, safe error code, status, duration, counters and deployment version | Up to 7 days from event creation in app-controlled storage |
| Security events | Event type, time, pseudonymous internal actor/account ID when needed, outcome and request ID | Up to 7 days; no raw email, tokens or submitted content |
| Deletion work | Operation ID, internal account/resource linkage needed to block access and finish removal, requested/deadline/lease/phase/attempt count and safe failure code | While required for active cleanup; remove personal linkage on completion, with completion metadata expiring within 7 days |
| Idempotency receipts | Owner/operation/mutation ID, payload fingerprint and noncontent result IDs/revision | Existing proposed 24-hour retry window; revoke content access on source deletion immediately |
| Quota state | Current reservations, safe usage counters, attempt linkage needed for reconciliation | Current applicable quota window; unresolved reservation linkage until conservatively settled; proposed max 7-day historical aggregates without account linkage |
| Chat history/source excerpts | User-owned application content, not diagnostic logs | Approved chat/source policies; never copied into audit records |

The seven-day diagnostic/security metadata ceiling is owner-approved; detailed work-record/receipt mechanics remain implementation proposals, not claims about host defaults. Internal identifiers are pseudonymous, not anonymous: protect them as private data. Avoid row-level audit events for every keystroke/read; record important failures and lifecycle transitions only. No event-sourcing/history subsystem or new telemetry cloud service is proposed.

## Prohibited diagnostic content

Never log note bodies/titles, reference URLs/descriptions, search queries, chat prompts/responses, retrieved excerpts, cookies, OAuth authorization codes, bearer tokens, API keys, database connection strings or deletion confirmation proofs. Use enumerated operation names, never raw request URLs with sensitive queries. Avoid raw IP addresses/device fingerprints in the initial application plan; introduce them only for a concrete reviewed abuse-control need.

Sanitize framework/provider error objects before writing logs; use allowlisted fields instead of serializing a whole exception/request/response. Stack traces can include application data and must be reviewed/redacted. Production debug mode and provider request-body logging are disabled. Ensure failure reports and screenshots used for development do not leak real account data.

## Storage, access and expiry

Prefer host-provided metadata-only runtime logs for short diagnostics, subject to verifying actual retention/access. Add database audit rows only for a concrete lifecycle/security requirement that cannot be satisfied otherwise. Do not duplicate all runtime events in PostgreSQL. Maintain least-privilege operator access; no public admin log viewer in MVP.

If host retention is shorter than the proposed seven-day ceiling, do not add a service merely to fill the gap. If it is longer, configure expiry or avoid sending linked metadata there; document any residual limitation before making a privacy promise. App database cleanup uses indexed expiry and bounded batches with retry/overdue visibility. Exact physical expiry latency depends on the selected executor and must be measured/disclosed; a seven-day target is not achieved by changing a database label alone.

Keep retention storage and token/attempt reconciliation bounded under public use. Detect unexpected growth and suspend nonessential diagnostics rather than silently buying storage. Audit limits must not block immediate access denial on account deletion. For operations requiring a durable work record, persist that record before acknowledging success and before performing external provider changes.

## Account deletion and re-registration

An account marked deleting remains blocked while cleanup/provider deletion is incomplete. Retaining the minimum active-work linkage is necessary to prevent sign-in from recreating the account early; this must be disclosed as unfinished deletion, not disguised as successful erasure. Escalate overdue live-data removal against the approved seven-day target.

On completion, remove user/content linkage from ordinary audit rows rather than keeping a long-term per-account identity trail. Keep only a minimal nonidentifying completion event if needed. No indefinitely retained email hash or provider subject ban list is authorized. New registration after completed deletion receives a fresh internal account identity and does not inherit old records. Confirmation receipts and late attempt completions must not restore access or old data.

Provider retention, auth-session cleanup and app-state deletion cannot be treated as one atomic transaction. Verify provider APIs/settings and describe actual behavior; do not claim app deletion retroactively removes inference content that a provider may have retained. User disclosure is tracked by version, not by copying user prompts into consent logs.

## Tests and release checks

1. Submit uniquely identifiable synthetic note/query/chat/credential canaries; inspect app-controlled logs and ensure no forbidden values are present, including provider/network failures.
2. Verify operator-only access and absence of a public log/deletion-status endpoint exposing identities.
3. Test event expiry, repeated cleanup, cleanup outages and overdue-work reporting with a controllable clock. Expiry retries must not double-settle quotas or revive receipts.
4. Race account deletion with mutations/provider callbacks; account remains blocked and no linked content is recreated.
5. Verify deletion completion removes account linkage from audit state while a new account is isolated from the old identity.
6. Confirm actual host/provider retention and logging settings at deployment; record differences and validate disclosure before public release.

No runtime/log-inspection tests have run. Exact audit events, expiry executor and provider settings remain implementation details. The seven-day diagnostic/security ceiling was explicitly approved by the owner on 2026-11-10; this does not change the separate content-deletion policies.

## Recommendation

Recommendation: a seven-day maximum for app-controlled operational/security metadata, minimal durable deletion-work state and no content logging. Reason: enough short-term debugging context without creating a second private knowledge store. Trade-offs: older incidents may lack detail; cleanup still needs reliable execution. MVP impact: resolve retention and implement the minimal safeguards alongside real auth/data features, not as a separate observability platform.

See [account lifecycle](../03-technical/account-lifecycle.md), [release readiness](release-readiness.md) and [foundation proposal](../02-architecture/foundation-implementation-proposal.md).

## Scope restraint

Owner approved the retention default and requested that it not receive excessive planning attention. Use minimal metadata-only logging and existing bounded cleanup mechanisms. Do not introduce a standalone observability/audit platform or reopen retention periods without a concrete implementation issue.
