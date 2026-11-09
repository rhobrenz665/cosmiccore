# Authentication and database integration validation

Status: Proposed recommendation | Checked: 2026-11-10

Documentation validation only. No package installation, account inspection, OAuth configuration, database creation or runtime authentication test occurred. Existing confirmed product decisions remain public Google registration and separate private data.

## Recommendation and evidence

Recommendation: use Neon managed Better Auth with a small custom shadcn/ui Google sign-in screen. Keep server-owned authorization and Drizzle data access. Avoid a separate self-hosted auth server, generic Data API and prebuilt multi-provider/email auth UI for this slice.

Reason: the required social sign-in fits a managed offering; our own small screen avoids presenting unselected auth methods. Trade-offs: provider SDK/configuration dependence and some unsupported plugin limits. MVP impact: use this as the proposed integration baseline, pending owner approval and implementation verification.

The [Next.js API quickstart](https://neon.com/docs/auth/quick-start/nextjs-api-only) documents `@neon/auth`, server initialization via `createNeonAuth`, `auth.handler()` for the catch-all proxy, and `auth.getSession()` returning a nested session result. Use a server auth module, client module and protected services. The guide describes a default 300-second session-data cache; validate freshness/revocation behavior before making security promises. Follow the compatible installed SDK/router conventions; no package versions are pinned yet.

Our design inference: the app's active-account status must also be checked at protected data boundaries so future account suspension/deletion does not rely solely on a cached provider session. Keep session and provider credentials out of logs. Do not equate a page redirect with resource authorization. Test callback errors, session restoration, direct mutation requests, logout and account switching independently.

## Google OAuth public access

[Neon's OAuth guide](https://neon.com/docs/auth/guides/setup-oauth) distinguishes shared Google development credentials from production credentials owned by the app. Copy the branch callback from Neon: `{NEON_AUTH_BASE_URL}/callback/google`. Google's authorized redirect is different from the app landing `callbackURL`; register the latter's origin as trusted in Neon. Each isolated environment needs matching configuration. Do not substitute a self-hosted Better Auth callback URL.

[Google's production guidance](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance) requires separate development/production projects, accurate app identity, secure redirects and minimal scopes. Propose identity-only `openid`, `email`, `profile`, with no Drive/Gmail permissions. Google's [app-state overview](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview) distinguishes External versus Internal audience, testing versus published state and scope/brand verification. Configure for External public use and validate the production state with a new ordinary Google account. Workspace administrators can still restrict their users: “anyone can sign in” means no CosmicCore family/invite allowlist, not a bypass of Google policy.

## Production checklist and budget uncertainty

[Neon's production checklist](https://neon.com/docs/auth/production-checklist) calls for trusted production domains, custom OAuth credentials, app naming and disabling localhost access in production. It also calls for custom SMTP and recommends email verification. Because our selected flow is Google-only, confirm which email features can be disabled and whether an SMTP requirement remains for the intended production setup. Do not claim email infrastructure is unnecessary without resolving that applicability. This is a documentation/configuration question, not a reason to silently add a paid mailer or password login.

[Neon pricing](https://neon.com/pricing) currently lists Managed Better Auth on Free with up to 60,000 MAUs per project, 100 database CU-hours monthly per project, 1 GB database storage and 5 GB included public transfer. These are current published allowances, not account inspection or unlimited app capacity. The same page lists limited restore history (up to 6 hours or 1 GB of changes) and one snapshot; this does not establish our 24-hour RPO or an independent backup. Auth request/rate/session details and exhaustion behavior still need account-level confirmation. Model inference is not included in an authentication recommendation.

## Proposed data driver decision

The [Neon driver guide](https://neon.com/docs/serverless/serverless-driver) distinguishes HTTP single/non-interactive query batches from WebSocket Pool/Client interactive transactions. Our save/idempotency/quota operations branch on locked query results; an HTTP-only callback transaction must not be assumed sufficient.

Recommendation: use `@neondatabase/serverless` Pool/Client with Drizzle's `neon-serverless` adapter in the Node runtime for the first slice. [Drizzle documents this integration](https://orm.drizzle.team/docs/connect-neon). Keep one driver path initially rather than independently optimizing reads. Trade-offs: connection lifecycle and WebSocket runtime compatibility require testing; validate matching stable versions rather than copying RC installation commands. Compare ordinary `pg`/TCP only if this integration fails or adds measured complexity. Consider HTTP later if transactions are deliberately redesigned as SQL batches/functions. No external AI call should hold a database transaction open.

## Planned files and configuration responsibilities

| Location/category | Intended responsibility |
|---|---|
| lib/auth/server | SDK initialization; documented server session verification |
| lib/auth/client | Same-origin client; Google sign-in/logout |
| app/api/auth/[...path]/route.ts | Supported SDK handler exports; no hand-built OAuth exchange |
| routing guard | Signed-out navigation; follow selected Next.js/SDK convention |
| server service context | Verified session → internal user mapping → active user → authorized services |
| lib/db | Drizzle connection/transaction lifecycle and least-privilege credentials |
| private environment | Database URL, branch auth URL and app cookie secret; separate by environment |
| Neon/Google configuration | Google client secret, callback registration, trusted origins and public audience |

This table is a plan, not existing files or a request to enter secrets into chat. The database auth schema remains provider-owned; do not generate application migrations for it. Validate stable provider auth-user IDs and identity mapping with actual SDK fields before defining foreign keys. Do not auto-link accounts by unverified email.

## Verification gates and decision status

1. Confirm account eligibility, auth quotas, supported region/network configuration and disabled unwanted auth methods without provisioning until authorized.
2. During authorized setup, configure separate dev/production Google credentials and exact callback/origin pairs; resolve SMTP applicability, privacy/branding and domain requirements.
3. Install compatible stable versions only during authorized implementation; verify Next.js server/client handlers and required runtime interfaces.
4. Execute new/returning login, canceled consent, reload/logout, expired/revoked session and wrong-origin/direct-action tests. Include Safari/mobile behavior; do not report success from documentation alone.
5. Test two users for all ownership paths, duplicate identity mapping, mutation/quota races and driver rollback/connection release.
6. Record cache freshness and account-blocking semantics; preserve the release gates for backups, retention, account deletion and public resource caps.

Conclusion: documented capabilities fit the selected workflow. Managed auth and interactive-transaction driver are recommended, not newly owner-approved or runtime-verified. $0 public production remains conditional on account settings and release requirements.
