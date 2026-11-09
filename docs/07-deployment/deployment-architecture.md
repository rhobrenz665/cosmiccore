# Deployment architecture

Status: Proposed

Local: Next.js development process, local PostgreSQL where practical, optional Ollama and deterministic AI fixtures. Installation belongs to a later authorized task. Development and production use separate database environments and credentials; preview deployments must never inherit production data or secrets.

Preferred production: Vercel Next.js Node runtime plus region-aligned Neon PostgreSQL. Use pooled application connections and a separately controlled migration connection. Verify driver transaction support and connection limits before selection. No always-on worker is assumed.

Future CI: typecheck/lint/tests/build; review generated Drizzle migrations; apply migrations once through a controlled deployment step, not per request or function startup. Prefer expand/contract changes; rehearse restore and rollback compatibility. GitHub Actions quotas and private repository deployment permissions are unverified launch checks.

Environment categories: database URL, auth secret/origin/OAuth credentials, provider API key/model IDs, quotas and timeouts. Only intentionally public settings receive a public client prefix. Never log secret values or note/chat content. Confirm cookie, trusted-origin, callback and preview settings per environment.

Bounded ingestion runs in explicit retryable requests initially; no promise of execution after a request ends. Durable jobs become necessary if batches regularly exceed the request budget or unattended ingestion becomes required. Choose scheduling/worker infrastructure only after measuring that need.

Monitor failures, latency, indexing backlog and spending. Expose an AI kill switch. Recovery requires exports plus an independently verified backup/restore policy; provider restore retention, RPO and RTO are unresolved release gates.

## Owner clarification — 2026-11-10

The app is publicly accessible, including personal use by the owner and family. Starting monthly budget is $0; no paid services or automatic paid overages are authorized. Mock interviews are confirmed for the next milestone. Separate private accounts and Google sign-in are confirmed. Public Google registration is confirmed; the auth library/service remains to be evaluated. These confirmations supersede earlier audience/budget assumptions in this draft.

## Confirmed note recovery decisions — 2026-11-10

7-day private Trash with immediate exclusion from normal lists/search/AI retrieval; owner can restore before expiry. Major-failure recovery target: at most 24 hours of lost changes. The backup mechanism is unverified under $0; RTO and backup/account/history retention remain unresolved. See [retention and recovery policy](data-retention-and-recovery.md).
