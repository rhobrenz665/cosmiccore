# Ordered implementation backlog

Status: Proposed task plan — implementation unauthorized | Updated: 2026-11-10

This refines the [feature backlog](feature-backlog.md) without replacing it. Task order reflects dependencies, not dates or estimates. The [readiness summary](../02-architecture/planning-readiness.md) identifies approved decisions, technical proposals and deferred scope. Finish/review each affected contract before implementing it; task listings are not permission to install, provision, commit, push or deploy.

## Planning tasks to finish first

| ID | Task | Deliverable and completion criterion |
|---|---|---|
| PLAN-01 | Combined Knowledge Base search | Expand only its umbrella spec: mixed note/reference result shapes, type filters, owner/deletion checks, ranking and stable pagination; link existing organization contracts |
| PLAN-02 | Settings/account workflow | New focused spec for profile, appearance, data actions, logout, account-deletion confirmation/status and accessibility; distinguish Proposed re-registration/session details |
| PLAN-03 | Foundation implementation proposal | One reviewable task covering package/version validation, app structure, shadcn tokens and minimal checks; explicit owner authorization before execution |

Provider console setup and live model evaluation can wait for their authorized implementation task. No need to finish future backups/local AI/interview designs to complete these planning tasks.

## Proposed implementation sequence

### BUILD-01 — Application foundation and shared shell

Dependencies: PLAN-01 through PLAN-03 review; explicit implementation authorization. Confirm compatible stable Next.js/React/TypeScript/Tailwind/shadcn/Drizzle versions from official docs at execution time. Initialize the app only in that authorized task. Build routes/shared primitives and token structure; desktop/mobile shell and six appearance/color combinations share one component tree.

Completion: build/type checks appropriate to the selected setup pass; shell navigation, keyboard focus, 320px width and 200% zoom have a demonstrable review. No fake provider, notifications, Pro badge, paid plan, interview or integration controls. Secrets remain untracked. Domain features may have clearly labeled empty states rather than simulated production success.

### BUILD-02 — Google identity and domain user mapping

Dependencies: BUILD-01; accepted auth integration decision; separately authorized provider setup. Use selected SDK proxy/server verification and Google-only sign-in UI. Configure isolated development auth before production; stable auth identity maps idempotently to an internal app user.

Completion: new/returning user, canceled consent, reload, logout/account switching, direct signed-out mutation and two-account negative cases pass. Reject unsafe return paths. No family allowlist. Document actual session freshness/revocation behavior; no blanket immediate JWT-revocation promise. Resolve required provider email/origin settings. Account creation race creates one mapping.

### BUILD-03 — Schema, authorized data access and quotas

Dependencies: BUILD-02; accepted transaction driver; reviewed schema. Add app-owned tables/constraints, active-account status, owner-matched relationships, note/reference revisions, usage counters and mutation receipts. Keep auth-managed schema out of application migrations. Configure application and migration roles separately as applicable.

Completion: isolated database tests prove foreign-owner relationships are rejected, rollback is atomic, duplicate receipts cannot duplicate mutations, concurrent budget reservation cannot exceed caps, and connections are released on failure. Generated migrations are reviewed and applied only through an authorized environment step. No model call/transaction coupling.

### BUILD-04 — Markdown notes and organization

Dependencies: BUILD-03; [first-workflow specification](../04-features/first-workflow/spec.md). Implement create/read/save, Markdown preview, flat collections/tags, serialized autosave and explicit revision conflict handling. Include mobile Edit/Preview, focus-mode exit, validation and failure states.

Completion: first-workflow save/organization acceptance scenarios pass, including edits during pending save, concurrent tabs, expired sessions, hostile Markdown, deleted associations and byte-size boundaries. Saved means the current buffer is acknowledged; errors preserve local text. No offline durability promise or blind overwrite.

### BUILD-05 — Trash and note cleanup

Dependencies: BUILD-04; chosen bounded maintenance trigger. Implement seven-day logical Trash/restore and retryable physical purge, indexes/leases as needed and atomic quota release. Keep exact logical deadline independent from scheduler timing.

Completion: deletion hides notes immediately, restore before expiry succeeds, at/after expiry fails, stale autosave cannot revive a note, concurrent restore/purge is safe, repeated purge does not double-decrement usage. Operator can identify overdue work. Measured physical-purge behavior is documented; backups are not a dependency.

### BUILD-06 — Reference capture, edits and links

Dependencies: BUILD-03/04; [References specification](../04-features/references/spec.md). Implement manual URL/title/description entry, owner-only duplicate normalization, organization, revision checks and explicit links to notes. Confirm deletion removes references immediately without Trash; linked notes survive.

Completion: REF-01 through REF-11 pass. Saving a URL performs no remote page/favicon/repository fetch. Concurrent duplicates commit once with correct storage accounting. Other users' matching URLs reveal nothing. Deleted reference source access and links are removed atomically or made ineligible immediately.

### BUILD-07 — Private search and Dashboard

Dependencies: BUILD-04/06; PLAN-01; [Dashboard specification](../04-features/dashboard/spec.md). Implement notes/reference and mixed knowledge searches, type/collection/tag filters, stable cursors, grid/list views and bounded Dashboard projections.

Completion: owned active results only; query failure distinct from no results; type/ranking cursor behavior matches PLAN-01; equal timestamps order deterministically. DASH-01 through DASH-10 pass. Dashboard loads do not call inference, manufacture counts or require an unimplemented chat route.

### BUILD-08 — Markdown transfer

Dependencies: BUILD-04/05; first-workflow transfer contract. Implement bounded individual .md import/export and bulk saved-active-note ZIP export if packaging is accepted. Use safe filenames, consistent snapshot behavior and explicit metadata/Trash exclusions.

Completion: malformed/binary/NUL/UTF-8/size/path-traversal cases fail safely; retry IDs avoid duplicate imports; deliberate repeated imports create separate notes. Exports exclude other accounts and Trash; unsaved edits are clearly handled. Disconnect/failure never claims complete download. Export is not advertised as full-account backup.

### BUILD-09 — Settings and account deletion

Dependencies: PLAN-02, BUILD-02/03 and relevant feature tables. Implement profile/preference settings, sign-out, typed/fresh-auth deletion confirmation, immediate account blocking and retryable live-data/provider cleanup targeted within seven days. Specify approved re-registration policy before implementing it.

Completion: appearance persists without account leakage; no post-block mutation can commit; interrupted cleanup retries; late generation cannot recreate content; sensitive data disappears from live access independently of provider session caches. Account-deletion status and failure handling remain private. Infrastructure cleanup is verified separately from UI disappearance. No backup workflow is added.

### BUILD-10 — Versioned RAG source preparation and retrieval

Dependencies: BUILD-04 through BUILD-07 and source lifecycle constraints. Implement bounded extraction/chunking, pending/failed/ready states, leases, source revisions and initial lexical retrieval using [RAG design](../03-technical/rag-architecture.md).

Completion: no mixed/stale/deleted/cross-owner chunks; interrupted indexing is retryable; source saves stay available without inference. Run retrieval portion of the synthetic evaluation first. Add embeddings/vector integration only through a separate accepted plan if lexical recall misses gates. Do not assume a vector service or new embedding provider is necessary.

### BUILD-11 — Hosted grounded chat

Dependencies: BUILD-09/10; separately authorized credentials; verified Groq Free account access/ZDR/disclosure; selected transport and tokenizer. Implement provider adapter, application/global quotas, bounded prompt/history, streaming attempts/checkpoints, intentional retry/cancellation, source mappings and history deletion.

Completion: CHAT-01 through CHAT-15 pass with deterministic provider stubs and authorized synthetic live evaluation. Actual free limits/usage are measured; no paid automatic fallback. Existing answer text survives source deletion until its conversation is deleted, but source access remains blocked. Generation success is durable before final event. Provider errors and uncertain usage settle conservatively. Owner's local Ollama remains untouched.

### RELEASE-01 — Public MVP readiness

Dependencies: relevant BUILD tasks and [release gates](../07-deployment/release-readiness.md), interpreted using the latest deferred-backup decision. Validate production Google configuration, host eligibility, account-specific quotas, secrets/environment isolation, cleanup execution, privacy disclosure, performance and accessibility. Controlled deployment requires authorization when concrete and reviewable.

Completion: each applicable gate has recorded evidence and unresolved failures are explicit. Knowledge-only pilot may precede chat, clearly labeled as incomplete full AI MVP. Do not claim backup/RPO guarantees, universal provider availability or unlimited AI. Review actual capacity rather than promising any number of public users from a provider's advertised registration/MAU limit.

## Work decomposition and evidence

Implement one bounded feature at a time; split the above tasks further when one cannot be reviewed/tested independently. Preserve a working foundation between tasks. Every implementation report states changed behavior, relevant tests/results and remaining risks. Passing checks are evidence, not automatic permission to push/provision/deploy. Avoid test suites that merely mirror markup; prioritize privacy, concurrency, lifecycle and data fidelity.

## Explicitly outside this sequence

Automated backups/disaster recovery, local Ollama/Qwen connectivity, mock interviews, MCP execution, public sharing, offline/native clients, voice, knowledge graph/analytics, nesting, rich text, PDF/file extraction and arbitrary web crawling. A new feature request may revise scope, but no task here silently adds them.

## Next recommended planning action

Complete PLAN-01 (Knowledge Base mixed search). Its accepted contract enables coherent reference/notes retrieval and Dashboard navigation. Then complete PLAN-02. Keep provider runtime testing for the later authorized chat implementation task; do not keep researching deferred operations instead of closing the current product contracts.
