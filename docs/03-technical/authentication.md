# Authentication

Status: Draft — specification placeholder

Provider selection remains Proposed; compare managed Neon Auth and self-managed Better Auth before approving integration. No custom password/session cryptography.

Require server-side session validation and authorization on every data boundary. Use secure HttpOnly cookies and appropriate SameSite behavior, trusted origins, CSRF protections for cookie-authenticated writes, OAuth state/PKCE as required by the selected library, session expiry/revocation, logout and account deletion. Never trust client-supplied owner IDs. Route protection alone is insufficient.

Pending: provider pricing/limits, account linking, guest access, session duration, recovery, callback configuration and identity-to-domain user mapping. Secrets stay server-side and separate by environment.

## Owner clarification — 2026-11-10

The app is publicly accessible, including personal use by the owner and family. Starting monthly budget is $0; no paid services or automatic paid overages are authorized. Mock interviews are confirmed for the next milestone. Separate private accounts and Google sign-in are confirmed. Public Google registration is confirmed; the auth library/service remains to be evaluated. These confirmations supersede earlier audience/budget assumptions in this draft.

## Confirmed access contract

Google sign-in is the sole selected method for the initial MVP. Each user has a separate private account. Family membership grants no access to another person's notes, references, conversations, retrieved chunks or citations. No application administrator content-viewing feature is proposed; infrastructure operators may still have database access, so this is not an end-to-end encryption promise.

Confirmed enrollment: anyone can sign in with Google and create a private account. No family email allowlist, invitation or manual enrollment approval is required. Bind the authenticated provider subject to a stable internal user ID. The auth service/library and session revocation behavior require specification.

Acceptance cases for the upcoming slice: a new Google user can register without an invitation; a returning user reaches their existing account; account A cannot read, change, export, search or cite account B's data; changing client-supplied IDs does not bypass authorization; expired/revoked sessions cannot mutate data.

## First workflow specification

See [workflow detail](../04-features/first-workflow/spec.md) and [concrete contracts](../04-features/first-workflow/contracts.md) for Proposed request/result shapes, data invariants, validation, concurrency, transfer behavior and acceptance scenarios. Provider SDK/configuration remains subject to verification; these documents do not provision or implement auth.
