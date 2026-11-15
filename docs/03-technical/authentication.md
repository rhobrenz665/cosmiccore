# Authentication

Status: Implemented for local development — production and multi-account runtime validation pending

Neon Auth powered by managed Better Auth is the approved authentication provider for the CosmicCore MVP. Google OAuth is the sole initial sign-in method, with public registration and separate private user accounts. Use Neon's supported authentication SDK and session-management integration rather than implementing custom password handling or session cryptography. Provider-specific configuration, session revocation, account linking, callback behavior, and free-tier limits must be validated before implementation and production deployment.

Require server-side session validation and authorization on every data boundary. Use secure HttpOnly cookies and appropriate SameSite behavior, trusted origins, CSRF protections for cookie-authenticated writes, OAuth state/PKCE as required by the selected library, session expiry/revocation, logout and account deletion. Never trust client-supplied owner IDs. Route protection alone is insufficient.

Implemented in BUILD-02: official Next.js server/client integration, same-origin auth proxy, Google-only sign-in, protected workspace routes, server-side session validation, sign-out, safe internal callbacks and an idempotent issuer/subject-to-`app_users.id` mapping. Secrets stay server-side and separate by environment.

Pending release evidence: real new/returning Google flows, canceled consent, session reload and account switching; two-account isolation after private resources exist; actual session freshness/revocation behavior; custom production Google credentials, trusted origins and production localhost disablement; account-specific quota confirmation. No guest access or password sign-in is included.

## OAuth return to sign-in: proxy registration

The BUILD-02 proxy was initially placed at the repository root while the application lives in `src/app`. Next.js ignored that file: the built middleware/function manifests were empty, so Neon's callback session-verifier exchange never ran. The workspace's server-side session guard then returned the browser to sign-in. The proxy now lives at `src/proxy.ts`, alongside `src/app`, as required by [Next.js source-directory conventions](https://nextjs.org/docs/app/api-reference/file-conventions/src-folder).

Verify that a production build includes the proxy and a signed-out request to a protected path redirects through it. Separately, `public.app_users` was confirmed absent during diagnosis. On 2026-11-15, the owner authorized applying the existing migration; it was applied successfully and verified through the application's database connection, including its primary key, status constraint and identity/email indexes. Neither proxy registration nor schema verification alone proves the complete OAuth flow.

After the proxy fix and migration, the owner confirmed dashboard access works. Reload persistence, sign-out/sign-in and two-account isolation remain runtime acceptance checks.

## Local Safari sign-in

The installed Neon SDK sets `__Secure-neon-auth` cookies with `Secure`, including the OAuth session challenge. Safari does not support the HTTP localhost exception for Secure cookies; Google can open successfully while the return to the application has no usable session. See [cookie transport requirements](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies).

For Safari, stop the HTTP development server, run `npm run dev:https`, and use `https://localhost:3000/auth/sign-in` for the entire flow. Next.js uses mkcert to generate local certificates; initial setup can request administrator approval to trust its development certificate authority. The owner must approve that trust setup. Do not bypass certificate warnings. See [Next.js local HTTPS setup](https://vercel.com/kb/guide/access-nextjs-localhost-https-certificate-self-signed).

Chrome on HTTP localhost is an alternative for development. Keep the SDK's Secure cookie settings intact. Successful OAuth must still be followed by dashboard access, reload and sign-out checks; the application identity migration must exist before dashboard entry. Local HTTPS configuration alone does not establish those acceptance results.

## Owner clarification — 2026-11-10

The app is publicly accessible, including personal use by the owner and family. Starting monthly budget is $0; no paid services or automatic paid overages are authorized. Mock interviews are confirmed for the next milestone. Separate private accounts and public Google registration are confirmed.

Neon Auth powered by managed Better Auth is the approved MVP authentication provider. Provider integration, OAuth callbacks, session lifecycle, account linking, and free-tier limitations must be validated before production deployment.

These decisions supersede earlier audience, budget, and authentication-provider assumptions in this draft.

## Confirmed access contract

Google sign-in is the sole selected method for the initial MVP. Each user has a separate private account. Family membership grants no access to another person's notes, references, conversations, retrieved chunks or citations. No application administrator content-viewing feature is proposed; infrastructure operators may still have database access, so this is not an end-to-end encryption promise.

Confirmed enrollment: anyone can sign in with Google and create a private account. No family email allowlist, invitation or manual enrollment approval is required. Bind the authenticated provider subject to a stable internal user ID. The auth service/library and session revocation behavior require specification.

Acceptance cases for the upcoming slice: a new Google user can register without an invitation; a returning user reaches their existing account; account A cannot read, change, export, search or cite account B's data; changing client-supplied IDs does not bypass authorization; expired/revoked sessions cannot mutate data.

## First workflow specification

See [workflow detail](../04-features/first-workflow/spec.md) and [concrete contracts](../04-features/first-workflow/contracts.md) for Proposed request/result shapes, data invariants, validation, concurrency, transfer behavior and acceptance scenarios. Provider SDK/configuration remains subject to verification; these documents do not provision or implement auth.

## Validated integration recommendation

See [auth integration validation](auth-integration-validation.md) for callback/session constraints, free-plan evidence and unresolved production requirements. A dedicated Neon development project and Managed Better Auth service were provisioned for BUILD-02. The custom Google-only interface uses the supported `@neon/auth` API; production Google credentials have not been configured.

Account-status blocking and deletion/session requirements are detailed in [account lifecycle](account-lifecycle.md). Provider session caching must not bypass app-level deletion status.
