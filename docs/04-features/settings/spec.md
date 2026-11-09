# Settings and account workflows

Status: Proposed detailed specification; confirmed policies identified below | Updated: 2026-11-10

## Objective and stories

Let users understand their account, control appearance, access data actions and leave the application safely. Stories: as a user I want a comfortable reading appearance; understand where AI sends my text; export my notes; sign out on this device; and delete my account with a clear statement of what happens.

This completes PLAN-02 from the [implementation backlog](../../01-product/implementation-backlog.md). It links existing behavior rather than creating a second account/transfer implementation. Confirmed policies are public Google accounts, private knowledge, shared Cosmic/Minimal/light/dark/system UI, immediate account blocking after confirmed deletion and live-data removal targeted within seven days without account recovery grace period. Backups and local AI are deferred.

## Scope and navigation

Settings has Profile, Appearance, Data and Privacy sections, with Account actions clearly separated from ordinary preferences. Desktop can use section navigation; mobile uses an accessible stacked list or shadcn/ui Tabs whose labels fit the viewport. Settings is protected by verified session and active-account checks.

MVP has no password form, email account linking, additional social provider, paid plan, MCP integration, local inference URL, notifications settings or admin browser of private content. Show only implemented capabilities; a Google-only app must not accidentally expose email/password registration through a generic auth UI.

## Profile

Show Google-derived display name, email and provider label. Approved MVP profile is read-only; Google identity/email changes are managed at Google, not through an editable app email field. Email is display/contact metadata, never a client-provided ownership key. Display name is escaped and may be absent; fallback User rather than exposing raw subject IDs. Do not fetch arbitrary remote avatar URLs server-side; initials are a safe initial presentation. An optional avatar policy requires separate validation if added.

Provide Sign out and a provider/account explanation. Do not claim signing out removes Google access grants or deletes the Google account. Profile reload verifies session and internal user lifecycle; a deleting identity does not automatically create another app account.

## Appearance

Two independent persisted settings: appearance `cosmic|minimal`, colorScheme `light|dark|system`. Approved first-visit colorScheme: System. Initial appearance is approved as Cosmic; System follows OS light/dark preference independently of visual style. Changes preview immediately; indicate Saving, Saved or Failed. On failure, restore last confirmed preference or offer explicit Retry, never claim persistence succeeded.

Server-stored account preferences are authoritative after sign-in. A local pre-render hint may avoid theme flash but must contain only nonsensitive appearance values; validate them and clear/reset account-specific state on logout/switch. Do not let the previous account's preferences override the next account's server settings. System selection follows OS changes while active without storing an inferred light/dark as the user's choice.

Proposed per-tab ordering: serialize preference writes, coalesce rapid toggles, and apply acknowledged revision only when it matches the latest intent. A simple preferences revision prevents stale writes; cross-tab conflicts refetch and require a new intentional change rather than an overwrite loop. Focus Mode is a per-workflow/session UI state for notes/chat, not a duplicate appearance setting; it must retain a visible keyboard-accessible exit. Respect reduced-motion preference independently of appearance.

Use shadcn/ui RadioGroup or ToggleGroup with visible group labels/selected states; both dimensions must be keyboard reachable. Do not rely on tiny unlabeled palette swatches, color alone or decorative gradients for selection. All six combinations keep the same information/action structure.

## Data actions

Link to existing Markdown import/export and note Trash workflows; do not add an alternative upload implementation in Settings. Explain scope: Markdown export covers saved active notes, not references, tags/collections, chat, Trash or a full account backup. Export before deletion is an option, not a forced prerequisite.

Trash displays the confirmed seven-day note recovery policy. References and conversations have no Trash; their deletion is immediate from live access after confirmation. Backup settings/restore buttons do not appear in MVP because disaster recovery is deferred. Never advertise the future 24-hour RPO as an existing account capability.

## AI privacy and usage

Display enabled hosted provider/model and a concise data-processing explanation from versioned operator configuration. Initial planning model is Groq Free/GPT-OSS 20B; actual availability/privacy settings remain unverified. Show the approved disclosure and whether the current user acknowledged it. Acknowledgment is required in the sending flow as specified by [Chat](../ai-chat/spec.md); Settings does not silently transmit sample notes or ping inference to check a status badge.

Usage shows bounded server-provided attempt/token allowance and known reset timing only if implemented. Do not equate the app's local counter with a provider billing statement or promise another user's shared quota will remain available. Unknown/exhausted state is explicit. Global settings and secrets are not user-editable. No “unlimited AI,” local-model picker, API key paste form, paid upgrade or automatic fallback.

## Sign-out and unsaved work

User selects Sign out → if an active editor has unsaved changes, offer Stay and finish saving or Continue signing out with a clear loss-of-unsaved-text warning → invoke supported auth logout → clear private client caches and buffers → navigate to signed-out view. A canceled prompt performs no logout. In-flight generation cancellation is best effort; logout does not prove upstream work consumed no tokens.

If logout fails, show retry without falsely claiming session revocation; clear sensitive visible client content where possible and explain server status is uncertain. Browser refresh/new protected requests verify sessions again. Provider JWT/cache revocation behavior follows validated auth integration, not invented instant-invalidation semantics. All-device session management is outside this initial UI unless separately specified.

## Account-deletion workflow

1. Open Account → Delete account. Explain irreversible app deletion/no recovery grace period, immediate access blocking, target of live-data removal within seven days, note/reference/chat scope, and that the Google account itself is unaffected. Do not promise exact provider-side erasure or external retention beyond validated terms.
2. Offer note export link and Cancel. If an editor has unsaved changes, resolve those before leaving; never imply unsaved text appears in export.
3. Proposed confirmation: type DELETE and complete a documented fresh Google/session confirmation. Verify actual managed-auth reauthentication API before choosing parameters. A recent session alone must not be assumed proof of fresh authentication. Confirmation intent is server-issued, purpose/account/session-bound, single-use and short-lived (proposed five minutes), not a token in a URL/log.
4. Server rechecks session, account, fresh authentication, same-origin/CSRF, intent and idempotency. Atomically mark account deleting and persist cleanup operation before acknowledging success. All concurrent domain mutations must serialize against this lifecycle change.
5. Immediately block all protected app access including source/status/export APIs. Clear client state and present a minimal deletion acknowledgment with no private content. No undo/restore action. Subsequent normal sign-in while deletion is pending yields an account-unavailable message, not an empty replacement account.
6. Bounded idempotent maintenance removes live dependent data and requests provider session/user cleanup. Failure remains blocked with operator-visible safe retry status. The seven-day removal target requires reliable execution/overdue-work handling; it is not achieved merely by hiding the page.

A publicly accessible deletion acknowledgment cannot expose whether an arbitrary email is deleting. Proposed acknowledgment lives only in the immediate response/browser state; authenticated deletion-progress UI is not required in MVP. Any future progress endpoint requires a narrowly scoped authorization model distinct from general account access. No permanent public lookup token.

Approved re-registration policy: allow a new empty account once prior app/provider deletion completes, without recovering prior data or bypassing active deletion. Minimal deletion/audit record retention remains a separate unresolved operational policy. Backup journals/restore reconciliation belong only to the future backup milestone.

## Service and data contracts

| Operation | Input | Result |
|---|---|---|
| getSettings | Verified server context only | Read-only profile; enum preferences+revision; safe provider disclosure/availability |
| updatePreferences Action | mutationId, expectedRevision, appearance, colorScheme | New revision and acknowledged settings |
| signOut | Supported auth SDK operation | Supported logout result; app cache cleanup |
| beginAccountDeletion Action | mutationId | Purpose/account/session-bound confirmation intent, expiry and required fresh-auth step; no lifecycle block yet |
| confirmAccountDeletion Action | intent, mutationId, typedConfirmation; supported fresh-auth proof | Durable blocked/deletion acknowledgment after transaction |

Use the existing typed Result envelope with safe error codes, requestId, optional field errors/retry timing. No client authoritative ownerId/provider subject/cleanup table selector. Validate every enum/revision and restrict intent replay. Store confirmation secrets only securely/hashed where applicable; avoid raw credential, token or body logging. API method names are application contracts, not claims about available Neon SDK methods.

Preferences are a one-to-one owner row or bounded fields on app_users with revision and timestamps. Avoid a generic arbitrary-JSON settings bag accepting unknown keys. Account state and cleanup work follow [account lifecycle](../../03-technical/account-lifecycle.md). Sign-out is not a database deletion. Profile is not an independent user-management directory.

## States, quality and dependencies

Loading, signed-out, account blocked, partial settings read error, preference-save failure/conflict, invalid confirmation, expired intent, failed reauthentication, uncertain logout and durable deletion acknowledgment all have distinct states. Preserve nonsecret form intent on retry, not expired proofs/tokens. Do not reset the entire settings page after a single preference error.

Use accessible AlertDialog for destructive confirmation, Dialog/Sheet for contextual actions, labels for typed confirmation and announced validation/errors. Return focus to the initiating control on Cancel. Full keyboard operation, 320px width, 200% zoom, reduced motion and all appearance combinations are required. Avoid nested dialogs for reauthentication; provide a safe supported redirect/return flow.

Settings must not call an AI model to read/save preferences. Proposed ordinary read/mutation warm p95 under one second on a representative account; authentication/cleanup/provider steps are measured separately, not hidden in that target. Dependencies: shared shell, auth, user lifecycle, transfer/Trash and provider disclosure configuration.

## Acceptance/test matrix

| ID | Scenario | Acceptance |
|---|---|---|
| SET-01 | Read profile including missing/hostile fields | Escaped read-only display; no editable identity/owner authority |
| SET-02 | All appearance combinations and system changes | One component tree; valid persistence; live system behavior without inferred overwrite |
| SET-03 | Rapid toggles, two tabs, save failure/reload | Ordered revision behavior; no false Saved or stale-account override |
| SET-04 | Switch accounts/logout/local hints | No private client data or preference leakage from previous account |
| SET-05 | Import/export/Trash links | Existing contracts; correct exclusions; no fake backup controls |
| SET-06 | AI disabled/disclosure unacknowledged/quota unknown | Accurate status and no inference call on Settings load |
| SET-07 | Logout with unsaved work or auth failure | Explicit choice; honest uncertain status; no claim of unperformed revocation |
| SET-08 | Wrong typed confirmation/stale intent/CSRF/foreign account | Deletion denied without lifecycle change or information leakage |
| SET-09 | Concurrent save and confirmed deletion | Account block is durable; writes cannot commit after transition |
| SET-10 | Provider cleanup outage and repeated delete | Idempotent retry; account remains blocked; operator can detect overdue work |
| SET-11 | Sign-in while deleting; late chat completion | No replacement account or re-created private data |
| SET-12 | Keyboard/dialog/mobile/zoom/reduced motion | Reachable labels/actions, visible focus and correct focus return |

Unit tests validate enum/revision/confirmation inputs; database tests cover lifecycle/write races and owner isolation; auth/UI integration tests cover logout, freshness and redirect behavior. No implementation or tests have run. Cosmic initial appearance, System color preference, read-only profile, empty-account re-registration and seven-day operational-metadata retention are approved. Implementation details remain Proposed.

## Header theme button

Owner requested a quick light/dark button; the [design system](../../05-design/design-system.md) specifies its Proposed interaction. System remains the first-visit preference. Clicking the button chooses the opposite resolved theme explicitly; choosing System in Appearance resumes OS following. Cosmic/Minimal does not change. Reuse preference ordering/revision/error handling. Add acceptance coverage for System-light → dark, System-dark → light, repeated toggle, returning to System, account switching and persistence failure.
