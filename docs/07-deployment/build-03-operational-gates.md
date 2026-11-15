# BUILD-03 operational gates

Status: Proposed; no operational values, cleanup executor, or database roles selected | Updated: 2026-11-15

## Purpose and current evidence

BUILD-03 final database acceptance passed on the development database; see [acceptance evidence](../03-technical/build-03-acceptance.md). This document records the remaining operational choices before public activation. It does not provision services, set environment values, create roles, or add cleanup code.

The owner approved a $0 starting budget, public Google registration, separate private accounts, and a maximum seven-day retention for app-controlled operational/security metadata. No public/global capacity numbers are approved. Application resource limits and provider infrastructure limits are different controls: global counters in the application do not hard-cap database compute, storage/egress, or hosting consumption. Neon documentation scopes project settings and resource limits to provider projects; the conclusion that these do not define CosmicCore's app-level note/API budgets is an inference from those separate scopes. [Neon project API](https://neon.com/docs/reference/api/projects/create-project)

## Gate 1 — global application capacities

### Current behavior

The application implements proposed per-account limits: 200 notes/10 MiB, 500 references/5 MiB, 50 collections, 100 tags, and 60 committed mutations per UTC minute. These are application policy defaults, not provider allowances. Seven global limits must be supplied as nonnegative safe integers before the mutation wrapper accepts any mutation:

| Environment setting | Accounting unit/window |
| --- | --- |
| `COSMICCORE_GLOBAL_NOTES_COUNT_LIMIT` | Live notes, lifetime; notes in Trash remain counted |
| `COSMICCORE_GLOBAL_NOTES_BYTES_LIMIT` | UTF-8 title/body bytes, lifetime; notes in Trash remain counted |
| `COSMICCORE_GLOBAL_REFERENCES_COUNT_LIMIT` | Live references, lifetime |
| `COSMICCORE_GLOBAL_REFERENCES_BYTES_LIMIT` | Stored URL/title/description bytes, lifetime |
| `COSMICCORE_GLOBAL_COLLECTIONS_COUNT_LIMIT` | Collections, lifetime |
| `COSMICCORE_GLOBAL_TAGS_COUNT_LIMIT` | Tags, lifetime |
| `COSMICCORE_GLOBAL_MUTATIONS_COUNT_LIMIT` | New committed mutations per fixed UTC minute |

Missing or malformed values fail closed before database mutation. A zero storage/count cap blocks positive growth but still permits a negative delta; a zero mutation-rate cap blocks all new committed mutations, including deletes, because each mutation consumes one rate unit. The limits apply to the app database's shared counters. They do not enforce a provider plan's compute, storage, transfer, or function limits. See the [quota implementation notes](../03-technical/build-03-mutations.md), [policy](../../src/lib/db/quota-policy.ts), and [environment template](../../.env.example).

### Proposed decision process and open choices

1. Establish the intended private-pilot user count and approximate per-user note/reference volume. Keep commercial use and paid overages outside the confirmed budget.
2. Check the actual Neon and hosting account/plan allowances for the selected deployment. Choose application caps with measured headroom; do not translate provider allowances directly into app counts without workload and storage measurements.
3. Decide whether the single set of global counters is sufficient for each environment/deployment and how maintenance/read-only/export paths behave at global exhaustion. No silent paid upgrade or provider fallback is allowed.
4. Record all seven approved values and the expected behavior at each cap before enabling public mutations. Keep the current environment template blank until the owner/operator selects values.

| Choice | Status | Blocking evidence |
| --- | --- | --- |
| Pilot size and global count/byte/rate values | Proposed; owner/operator decision pending | Measured or explicitly bounded pilot workload, current account allowances, and exhaustion behavior |
| Reserve a deletion path when the global mutation-rate cap is exhausted | Proposed | Decide whether deletion is allowed to use a separate safety budget; current implementation charges every committed mutation |
| Provider infrastructure budgets and exhaustion alerts | Proposed | Verify actual Neon/hosting account limits and alert/suspension behavior; application counters are not infrastructure hard limits |

### Acceptance evidence

- All seven values are documented per environment; missing configuration rejects mutations without partial writes.
- Independent accounts racing against a global count/byte cap produce no over-cap commit; counters match content and receipts.
- Tests cover cap exhaustion, cap reduction, zero limits, deletion/reduction behavior, and visible user-facing errors.
- Operator confirms provider resource limits and observes a safe warning/exhaustion path without paid overage.

## Gate 2 — receipt and rate-counter cleanup

### Current behavior and retention boundary

Mutation receipts are logically valid for 24 hours, after which replay is rejected while the receipt remains. Physical deletion and its executor are not implemented. Rate rows are stored per account and globally by UTC minute. Lifetime note/reference count and byte rows use the UTC epoch and are canonical accounting state; they must not be mistaken for old rate-window rows or deleted by a general age purge.

The approved maximum retention for app-controlled operational/security metadata is seven days. It is a ceiling, not an implemented TTL. PostgreSQL `DELETE` removes live rows, while `VACUUM` handles dead row versions and space reuse; autovacuum does not delete still-live expired application rows or implement a product retention policy. [PostgreSQL routine vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html), [PostgreSQL DELETE](https://www.postgresql.org/docs/current/sql-delete.html), and the [existing operational retention plan](operational-audit-retention.md).

### Proposed cleanup contract

- Delete only receipts whose `expires_at` has passed. Bound each batch, make retries idempotent, and complete deletion within seven days of receipt creation to honor the approved metadata ceiling. The 24-hour logical expiry remains authoritative regardless of cleanup lag; clients must not automatically retry beyond it.
- Delete only `mutations_count` rate-window rows older than the approved seven-day metadata ceiling. Use database time and bounded batches. Preserve all epoch-window count/byte rows and never recalculate lifetime totals from retained rate history.
- Coordinate per-account cleanup with the existing owner mutation lock and process accounts in stable order where account-scoped locks are needed. Global cleanup must not invert the existing account/global counter lock order. Review this against account deletion and in-flight mutation behavior before implementation.
- Use an existing controlled execution path if it can meet the bound. A schedule, batch size, retry policy, alert threshold, and deployment owner remain Proposed; no standalone worker or observability service is selected.
- Record only safe counts, duration, and error codes. Do not log note content, URLs, payloads, credentials, or receipt payload hashes.

### Acceptance evidence

- Controlled-clock tests prove receipts reject replay after 24 hours before and after physical cleanup; cleanup never deletes a live receipt.
- Repeated cleanup and injected interruption leave correct results and do not change lifetime usage counters.
- Old synthetic rate rows are removed while recent rate rows and epoch storage rows remain; account/global counters agree for retained windows.
- Cleanup remains bounded under backlog, recovers after an outage, and signals when expired metadata approaches the seven-day ceiling.
- Account deletion racing with cleanup leaves access blocked, settles global storage totals exactly once, and does not recreate receipts or content.

## Gate 3 — application and migration database roles

### Current boundary

Runtime transactions read `DATABASE_URL`; Drizzle migrations read `DATABASE_URL_UNPOOLED`. Separate environment-variable names and pooled/unpooled endpoints do not prove that the credentials have different database roles or privileges. No role setup or least-privilege grant verification has been recorded. [Runtime transaction](../../src/lib/db/transaction.ts) and [migration configuration](../../drizzle.config.ts).

PostgreSQL grants privileges to roles, distinguishes object ownership from ordinary table privileges, and permits role attributes such as `SUPERUSER` and `CREATEROLE`. An object owner retains control over that object. [PostgreSQL privileges](https://www.postgresql.org/docs/current/ddl-priv.html), [CREATE ROLE](https://www.postgresql.org/docs/current/sql-createrole.html), [GRANT](https://www.postgresql.org/docs/current/sql-grant.html). Neon supports creating separate branch roles, but that does not automatically create the required privilege split. [Neon create-role API](https://neon.com/docs/reference/api/branches/create-project-branch-role)

### Proposed separation

- Use a dedicated runtime login role for the application process, with only the schema/table privileges needed for application reads, writes, and tested cleanup operations. It must not own application objects or have `SUPERUSER`, `CREATEROLE`, or DDL privileges.
- Use a separately controlled migration credential only for reviewed migration and schema-maintenance steps. Keep it out of runtime deployments and ordinary request handling. Decide whether the migration login owns app objects or receives a narrower deployment role; ORM migration compatibility and grants must be verified rather than assumed.
- Keep per-user authorization in server-side application services. Role separation limits DDL/administrative blast radius; it does not by itself isolate one user's rows from another user's rows.
- Do not broaden grants until denied-operation checks identify the exact needed privilege. Verify default privileges for future tables as well as existing objects.

### Acceptance evidence

- Catalog/grant inspection records effective privileges for both logins, object ownership, memberships, and default privileges without exposing secrets.
- Runtime can perform required reads, feature mutations, counter reservations, and bounded cleanup; it cannot create/alter/drop schema objects, grant privileges, or manage roles.
- The migration credential can apply reviewed migrations in a nonproduction environment and is absent from app runtime configuration.
- Two-account negative authorization checks still pass; role separation is not presented as a replacement for owner-scoped queries.

## Outstanding limits

Development acceptance passed, but socket loss exactly during `COMMIT`, target-host connection/transaction behavior, and the operational gates above remain unverified. This document does not approve production capacity values, execute cleanup, select a schedule, create roles, or declare BUILD-03 ready for public launch.

Official documentation checked 2026-11-15. Provider documentation describes capabilities and API scopes; it does not prove current account entitlements or suitability for this project's workload. PostgreSQL documentation explains role and row-maintenance semantics; actual provider privileges and plan behavior require environment-specific verification.
