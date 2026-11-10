# Security and privacy baseline

Status: Proposed

## Identity and data boundaries

Anyone may sign in with Google; each account owns private knowledge. Neon Auth powered by managed Better Auth is the approved MVP authentication provider. Validate authenticated sessions on the server and map stable provider identities to internal application users (app_users).

Configure secure HttpOnly session cookies, trusted origins, and CSRF protections according to the supported Neon Auth integration. Authentication does not replace record-level authorization: every private operation must enforce ownership using the authenticated user's identity. Exact session lifecycle, revocation behavior, and integration details must be verified before launch.

Owner filters and relational constraints cover notes, collections, tags, references, search, exports, conversations, chunks and citations. Private results must not be shared across users through caches. Account switching/logout clears client state. SQL access is server-only with least privilege; migration credentials are separate. Test two identities at every entry point.

## Untrusted content and public abuse

Treat Markdown, URLs, imports and retrieved text as untrusted. Sanitize HTML rendering, restrict protocols, disable raw HTML unless safely sanitized, and escape UI labels. No server fetching of arbitrary URLs in MVP. No AI tools execute retrieved instructions. Source IDs alone do not prove answer support.

Apply atomic database-backed rate and storage budgets to authenticated expensive operations, with global ceilings and an AI kill switch. In-memory counters alone are insufficient across serverless instances. Proposed same-database counters avoid a new service but need contention/compute evaluation. Anonymous traffic also needs hosting-level protection; application quotas cannot prevent all infrastructure consumption. Exact thresholds depend on provider limits and load tests.

## Privacy and recovery

Logs contain request IDs, status, timings and usage counts rather than note/chat content or credentials. Hosted AI privacy/retention terms require review and clear product disclosure before transmitting private text. No end-to-end encryption promise: infrastructure operators may access stored content.

Account deletion must stop application access and retrieval immediately, then remove content and derived state under a defined retention policy. Backups may retain deleted data until expiry; disclose and verify the expiry. Session/JWT revocation semantics must match actual auth behavior. Define data retention, backup encryption/access, RPO/RTO, restore validation and incident response before launch.

Launch checks are tracked in [release readiness](../07-deployment/release-readiness.md).

## Confirmed note recovery decisions — 2026-11-10

7-day private Trash with immediate exclusion from normal lists/search/AI retrieval; owner can restore before expiry. Major-failure recovery target: at most 24 hours of lost changes. The backup mechanism is unverified under $0; RTO and backup/account/history retention remain unresolved. See [retention and recovery policy](../07-deployment/data-retention-and-recovery.md).
