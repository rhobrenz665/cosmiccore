# MVP product requirements

Status: Draft — review baseline | Updated: 2026-11-10

## Purpose and confirmed boundaries

CosmicCore is a publicly accessible personal knowledge and learning app, also serving as the owner's production engineering training project. Anyone can register using Google; every account has private data. Public availability does not make saved knowledge public. Starting operating budget is $0. No paid fallback or automatic upgrade is authorized.

Confirmed: Markdown editor/preview, flat collections and tags, individual .md import/export, bulk Markdown export. Interviews are next milestone. Sharing, nesting, rich-text editing, binary uploads, crawling, MCP execution and offline sync are deferred. [Scope](mvp-scope.md) remains the release boundary.

## Personas and success

A learner captures notes and references, retrieves them later, and asks questions grounded in those sources. A returning user resumes work across devices. The operator learns production practices while controlling public usage and spending.

Success is demonstrated through observable journeys below, not user growth promises. Hosted AI availability is conditional on a verified free provider and budget guardrails; a knowledge-only pilot is a separate release stage, not completion of the AI MVP.

## Functional requirements and acceptance

| ID | Requirement | Observable acceptance |
|---|---|---|
| AUTH-01 | Public Google registration, returning sign-in and logout | New Google identity creates one app account without invite; repeat login returns the same account; logout blocks authenticated pages/actions |
| SEC-01 | Private ownership on every operation | Account B cannot read, mutate, export, search, retrieve or cite account A's records even with known IDs |
| NOTE-01 | Markdown create/read/update/delete with preview | Saved text survives reload; rendered Markdown cannot execute scripts; deletion moves the note to 7-day private Trash, immediately excludes it from search/retrieval, and allows owner restoration before expiry |
| NOTE-02 | Autosave with visible state and revision check | UI shows unsaved/saving/saved/error/conflict accurately; stale edits never silently overwrite newer text |
| ORG-01 | Flat collections and tags | An owner can assign/filter their items; cross-owner assignments fail; collection deletion preserves notes |
| REF-01 | Manual website/GitHub reference saving | Valid HTTP(S) URL, title and description save without crawling; unsafe URL schemes are rejected |
| SEARCH-01 | Owner-scoped search and filters | Notes and references match text queries, tags and collections; no-results differs from service failure; results are paginated |
| PORT-01 | Markdown import and export | Individual .md creates a new private note; individual/bulk export contains only requesting user's saved notes |
| DASH-01 | Recent work and capture shortcuts | Recent notes/references and resume targets open authorized records; new accounts see useful onboarding |
| AI-01 | Grounded question answering | Retrieved sources belong to the user; citations resolve to retrieved authorized sources; no evidence yields an explicit insufficient-evidence response |
| AI-02 | Streaming and history | Completed conversation survives reload; interrupted generation remains marked incomplete; retry does not duplicate the submitted message |
| AI-03 | Quotas and failure handling | Per-user/global budget reservation is atomic; exhausted or unavailable AI gives a clear state without losing notes |
| PREF-01 | Appearance and focus | Cosmic/Minimal each support light/dark/system; focus mode works for editor/chat without changing records |
| ACCOUNT-01 | Profile/settings and deletion | User sees their profile/preferences; account deletion requires confirmation and blocks subsequent app access; retention timing follows the approved policy |

## Quality requirements

- All mutations validate authentication, ownership and input on the server. Private content must not enter shared caches, logs or analytics.
- Notes, search and export operate without an AI provider. Database/auth outages remain visible failures, never false success.
- Core journeys work at 320px width, 200% zoom, with keyboard navigation and reduced motion. Contrast targets are specified in the design system.
- Bound request sizes, query sizes, pagination, AI context and execution time. Exact quotas/performance thresholds below are proposed and require implementation measurement.
- Concurrent tabs use optimistic revision checks; this is not collaborative editing or offline synchronization.
- Development/preview data and secrets are isolated from production. Database changes use reviewed migrations and a rehearsed recovery path.

## Proposed capacity policy

Before public launch, set operator-configurable per-user storage/write/request limits and global safety ceilings. Return actionable quota errors and allow reads/exports when storage writes are suspended, provided database/hosting remain available. AI starts disabled until model, privacy, free allowance and rate limits are verified. No hard-coded promise of unlimited access.

## Workflows, dependencies and completion

[User journeys](user-workflows.md), [system diagrams](../02-architecture/diagrams/README.md), [data model](../03-technical/database-design.md), [API boundaries](../03-technical/api-design.md), and [release gates](../07-deployment/release-readiness.md) define the cross-feature baseline.

Feature details under ../04-features/ must be completed before each implementation task. Provider selection, exact limits, data retention/recovery and AI quality targets remain explicit open decisions. This draft is reviewable overall planning, not final implementation approval.

## Current scope decision — 2026-11-10

Owner deferred application-managed backups and disaster recovery to a future milestone, outside MVP. Backup hosting remains undecided; no service is selected. The approved 24-hour RPO and seven-day encrypted backup retention apply to that future capability, not MVP guarantees or release gates. Existing provider history is incidental, not a promised recovery service. MVP keeps Markdown import/export, seven-day note Trash/restore, immediate account-deletion access blocking and live-data removal targeted within seven days. Cleanup required for those features remains in scope. This decision supersedes earlier backup/restore release gates in this document. No disaster-recovery guarantee is offered for MVP.

## Detailed feature coverage

[References](../04-features/references/spec.md) and [Dashboard](../04-features/dashboard/spec.md) now have detailed Proposed requirements, workflows, errors, contracts and acceptance matrices. Reference deletion is confirmed immediate after confirmation, without Trash. URL normalization, resource thresholds and summary layouts remain Proposed technical details. Backups remain outside MVP.

## Detailed grounded-chat baseline

See [AI Chat specification](../04-features/ai-chat/spec.md) and [chat contracts](../04-features/ai-chat/contracts.md) for Proposed source mapping, request/stream/persistence behavior, concurrency/quota reservations and acceptance tests. Online free-API models are current scope; local Ollama/Qwen integration remains future scope. Provider/model, history-retention policies and runtime quality remain unresolved.

## Approved chat retention — 2026-11-10

Conversation history remains until the user deletes it, subject to storage limits. Confirmed conversation deletion removes live access immediately without Trash; dependent content cleanup is bounded and must not be undone by late generation. Deleting a source blocks future retrieval/citation access, while existing generated answer text remains until its conversation is deleted. Account deletion overrides retention under its approved policy. Implementation details remain Proposed.
