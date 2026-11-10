# Architecture decision register

Status: Proposed | Updated: 2026-11-10

The project brief establishes the selected technology stack.
Architecture Decision Records (ADRs) track implementation
choices independently. Each ADR retains its own approval
status, and a selected technology does not automatically
mean its integration design has been approved.

## ADR-001: Next.js full-stack

- Status: Proposed
- Context/problem: The selected stack needs UI and trusted server logic.
- Proposed solution: One App Router deployment with feature services.
- Alternatives: Separate API or client-only SPA.
- Benefits: Fewer deployments and shared contracts.
- Drawbacks: Framework coupling and request limits.
- Costs: Hosting usage.
- Risks: Accidental client exposure or shared caching.
- Reconsider when: Independent clients or workloads requiring a distinct backend.

## ADR-002: Neon PostgreSQL

- Status: Proposed
- Context/problem: The selected relational store must isolate private data affordably.
- Proposed solution: Neon with pooled application connections and separate environments.
- Alternatives: Local PostgreSQL for development; another managed PostgreSQL host.
- Benefits: Relational integrity and portable SQL.
- Drawbacks: Cold starts and provider quotas.
- Costs: Free within current allowances; usage-based upgrade.
- Risks: Storage/connection/restore assumptions.
- Reconsider when: Sustained quota pressure or unavailable regional requirements.
- Decision: Use Neon Auth powered by managed Better Auth as the authentication provider for CosmicCore MVP.
- Sign-in method: Google OAuth.
- Identity management: Neon-managed authentication integrated with PostgreSQL.
- Authorization: Validate authenticated sessions on the server and enforce ownership checks for all private user data.
- Session security: Use secure session handling supported by the Neon Auth Next.js integration.
- Implementation: Follow Neon's supported SDK and Next.js integration patterns rather than assuming self-hosted Better Auth configuration.
- Status: Approved product and provider selection; implementation details require validation.

## ADR-003: Drizzle ORM

- Status: Proposed
- Context/problem: The selected ORM must support reviewable schema evolution.
- Proposed solution: Drizzle schema and reviewed Drizzle Kit migrations.
- Alternatives: SQL migrations directly; other ORMs.
- Benefits: Typed access and visible SQL.
- Drawbacks: Developer owns migration safety.
- Costs: Development/CI time.
- Risks: Destructive or incompatible migrations.
- Reconsider when: Unsupported transactional/query requirements.

## ADR-004: Authentication

- Status: Proposed
- Context/problem: Google sign-in is approved for the MVP, but the authentication provider, session lifecycle, and integration details still require technical evaluation and approval.
- Proposed solution: Evaluate managed Neon Auth first, with Google as the confirmed sign-in method. The auth library/service remains Proposed.
- Alternatives: Self-managed Better Auth or another managed provider.
- Benefits: Potentially fewer operating tasks.
- Drawbacks: Provider integration and quota dependence.
- Costs: MAU/email/session pricing unverified.
- Risks: OAuth callback misconfiguration, insecure session cookies, session hijacking, unauthorized access to private user data, and improper account isolation. All protected server operations must validate the authenticated user and enforce ownership checks.
- Reconsider when: Cost, required methods, export or security requirements fail evaluation.

## ADR-005: RAG storage

- Status: Proposed
- Context/problem: Private grounded retrieval must fit a small database.
- Proposed solution: PostgreSQL full-text first; evaluate pgvector in the same database.
- Alternatives: Add pgvector-based hybrid retrieval if lexical-only quality fails evaluation; consider a separate vector service only if PostgreSQL no longer meets measured requirements.
- Benefits: One ownership boundary and fewer services.
- Drawbacks: Embedding storage/reindex cost; lexical quality limitations.
- Costs: Embedding inference and database storage.
- Risks: Poor recall or incompatible dimensions.
- Reconsider when: Measured quality or latency fails the evaluation set.

## ADR-006: AI abstraction

- Status: Proposed
- Context/problem: Model costs and availability change.
- Proposed solution: Small chat/embedding adapter; evaluate Vercel AI SDK for streaming.
- Alternatives: Direct provider SDK; gateway after comparison.
- Benefits: Provider replacement without rewriting domain logic.
- Drawbacks: Capabilities still differ; no universal interchangeable promise.
- Costs: Inference tokens, SDK maintenance.
- Risks: Silent fallback changes privacy/cost/quality.
- Reconsider when: A required capability cannot fit the adapter.

## ADR-007: MCP

- Status: Proposed
- Context/problem: External tool execution expands trust and hosting needs.
- Proposed solution: Defer runtime MCP; document a future permission boundary.
- Alternatives: Allowlisted read-only remote MCP pilot.
- Benefits: Avoids current execution and credential burden.
- Drawbacks: No tool integration in MVP.
- Costs: Future hosting/tool calls unverified.
- Risks: Credential leakage, injection and unauthorized side effects.
- Reconsider when: A concrete approved workflow needs an external tool.

## ADR-008: Hosting

- Status: Proposed
- Context/problem: Vercel is preferred under free-tier constraints.
- Proposed solution: Vercel Hobby only for eligible personal pilot; reassess for launch.
- Alternatives: Paid Vercel or alternative Next.js hosting.
- Benefits: Simple full-stack delivery.
- Drawbacks: Execution and eligibility restrictions.
- Costs: Quota-bound free pilot; paid launch may be needed.
- Risks: Long operations and quota pauses.
- Reconsider when: Commercial use, duration limits or usage exceed plan.

## Owner decision record — 2026-11-10

Status: Approved — these three product constraints only. ADR integration proposals above retain their own Proposed statuses.

- Audience: public access, including personal use by the owner and family. Separate private accounts are now confirmed, requiring multi-user isolation. Sharing is excluded; public Google registration is confirmed.
- Starting budget: $0/month. Paid services and automatic paid overages are outside scope. Consequence: hosted AI availability depends on verified free allowances; disable unavailable AI rather than incur charges. Alternative: revisit an explicit paid ceiling later.
- Mock interviews: next milestone, outside the first MVP. Benefit: focus on capture, retrieval and chat; drawback: interview practice arrives later.
- Reconsider when: the owner changes audience, budget or release priority.

## Owner decision record — private accounts and Google

Status: Approved | Date: 2026-11-10

- Context/problem: family use requires explicit privacy and sign-in boundaries.
- Decision: separate private accounts, authenticated using Google. No shared family knowledge in the MVP.
- Alternatives: shared account, selected-resource sharing, other sign-in methods.
- Benefits: individual privacy and a familiar sign-in method.
- Drawbacks: no family collaboration in the initial release; users need Google accounts.
- Costs: auth implementation must fit the $0 budget; no provider pricing assumption is approved.
- Risks: Public registration exposes the app to abuse and quota exhaustion. Apply per-user and global usage limits while keeping records private. Exact implementation requires provider validation.
- Reconsider when: the owner requests sharing or a family member needs another sign-in method.

Neon Auth powered by managed Better Auth is the approved MVP authentication provider under ADR-004. Self-managed Better Auth is not selected for the MVP. Authentication SDK integration, session management, OAuth configuration, and deployment compatibility still require technical validation before implementation and production release.

## Enrollment clarification — 2026-11-10

Status: Approved. Anyone can sign in with Google. This supersedes the earlier family-only enrollment proposal. Each account retains private data. The project is also a production-minded learning project; the $0 budget and interview deferral remain unchanged. Public registration does not imply unlimited AI usage. Hosting eligibility and capacity require verification before launch.

## Owner decision record — knowledge workflow

Status: Approved | Date: 2026-11-10

Confirmed on 2026-11-10: Markdown notes with an editor and preview; flat collections plus tags; individual `.md` import/export and bulk Markdown export. Rich-text editing, nested collections, PDF/Word import and automatic website extraction are deferred. Bulk export packaging and metadata fidelity remain specification details.

- Context/problem: define the first capture, organization and export workflow.
- Benefits: portable notes, simple organization and an AI-independent export path.
- Alternatives: rich-text editor, nested collections and additional document import formats.
- Drawbacks: fewer formatting and hierarchy options initially; Markdown export alone does not guarantee a full account backup.
- Costs: implementation and validation within the existing application; no new cloud service proposed.
- Risks: unsafe rendered Markdown, import size/encoding errors and incomplete exports require explicit acceptance tests.
- Reconsider when: real usage demonstrates a need for richer editing, nesting or additional formats.

## Owner decision record — note recovery

Status: Approved product targets | Date: 2026-11-10

- Context: accidental note deletion and major-failure recovery need explicit expectations.
- Decision: 7-day Trash, immediately excluded from search and AI retrieval; at most 24 hours of lost changes in a major failure (RPO target).
- Alternatives: immediate permanent note deletion; different recovery windows.
- Benefits: accidental-deletion recovery and measurable backup objective.
- Drawbacks/costs: Trash and backups consume storage; restore/purge operations add implementation work.
- Risks: a $0 backup mechanism is not yet verified; remaining history/account/backup retention and RTO are unresolved.
- Reconsider when: storage budget, privacy needs or restore tests demonstrate infeasibility.
- Specification: [retention and recovery](../07-deployment/data-retention-and-recovery.md).

## ADR-004 validation update — 2026-11-10

Status: Proposed (documentation evidence checked). Recommend managed Neon Better Auth with Google-only custom shadcn/ui screen. Supported Next.js/social capabilities fit the slice. Remaining risks: session-cache freshness, production OAuth/domain setup, SMTP applicability and account limits. No additional provider approval inferred. See [validation](../03-technical/auth-integration-validation.md).

## ADR-009: Transaction-capable database driver

- Decision: Use Neon PostgreSQL with Drizzle ORM.
- Primary transactional driver: Neon WebSocket (neon-serverless) for interactive transactions.
- Optional query driver: Neon HTTP for simple, non-interactive operations.
- Connection strategy: Use pooled application connections and direct connections for migrations.
- Runtime: Next.js server-side Node.js runtime for database operations.
- Validation: Test transactions, rollback, concurrency, and connection cleanup in the target Vercel runtime before final approval.

## Owner decision record — account deletion and backup expiry

Status: Approved product targets | Date: 2026-11-10

- Context: account erasure and backups need explicit, separate retention rules.
- Decision: block app access immediately after confirmed deletion; target live-data removal within seven days with no recovery grace period. Retain encrypted backups for seven days, then expire them.
- Alternatives: account recovery grace period; 30-day backup retention.
- Benefits: immediate privacy boundary and short, explicit retention.
- Drawbacks/costs: less recovery history; cleanup/expiry/journal operations require reliable execution and storage.
- Risks: independent $0 backup and provider cleanup are unverified; backups may temporarily retain deleted content until expiry. Restores must reapply later deletion requests.
- Reconsider when: the owner changes recovery/privacy requirements or feasibility tests cannot meet the targets.
- Details: [account lifecycle](../03-technical/account-lifecycle.md), [backup plan](../07-deployment/backup-and-cleanup-plan.md).

## Owner decision record — defer backups beyond MVP

Status: Approved scope change | Date: 2026-11-10

- Context: backup hosting remains undecided under the $0 budget; owner chose future scope.
- Decision: application-managed backups and disaster recovery are outside MVP. Retain 24-hour RPO and seven-day encrypted retention as future targets only.
- Benefits: removes an operational dependency from MVP delivery.
- Trade-offs/risks: MVP has no promised disaster-recovery capability; Markdown export and Trash do not replace database backup.
- Costs: no additional backup service selected or provisioned.
- Retained MVP work: safe migrations, user export/import, seven-day Trash, account access blocking and live-data deletion cleanup.
- Reconsider when: the owner starts the backup milestone or changes recovery needs.

## Owner decision record — reference deletion

Status: Approved | Date: 2026-11-10

- Context: note Trash does not establish retention for saved references.
- Decision: immediate reference removal after confirmation; no reference Trash. Preserve linked notes and remove reference associations/search/retrieval access.
- Alternative: seven-day reference Trash.
- Benefits: simple deletion semantics and less retained live data.
- Drawback: no built-in reference recovery after confirmation.
- Costs/risks: transactional cleanup and stale-update protection are required; historical generated excerpts are governed separately.
- Reconsider when: the owner requests reference recovery based on usage.

## Owner direction — optional free hosted and local AI

Status: Approved capability direction; integration Proposed | Date: 2026-11-10

- Context: the owner wants both free online models and their local AI.
- Direction: optional approved provider adapters, with provider/model recorded per attempt and explicit selection.
- Alternatives: hosted-only or local-only inference.
- Benefits: model flexibility and local compute reuse; drawbacks include differing limits, privacy and connectivity.
- Costs/risks: free API quotas are limited; local hardware uptime/electricity still matter; public access to local compute requires separate secured topology.
- Reconsider when: selected provider terms/availability or hardware do not satisfy the evaluated workload.
- Unresolved: runtime/model, intended availability of owner local compute and exact hosted provider/model. [Provider options](../03-technical/ai-provider-options.md) contains current evidence.

## Owner scope refinement — local AI deferred

Status: Approved | Date: 2026-11-10

Ollama with a Qwen ~7B model is the owner's local option (exact tag unknown). Local integration/connectivity is future scope. Focus the initial AI milestone on free online API models; retain the provider adapter seam without building a bridge or local selector. No hosted provider or model is approved by this scope refinement.

## Owner decision record — chat retention and source deletion

Status: Approved | Date: 2026-11-10

- Context: conversation deletion and deletion of its cited sources have distinct effects.
- Decision: retain chat history until user deletion; confirmed deletion removes it without Trash. Source deletion blocks future retrieval/citation access but leaves existing generated answer text until the conversation is deleted.
- Alternatives: automatic chat expiry, chat Trash or automatic historical-answer redaction.
- Benefits: predictable history and simple user-controlled deletion.
- Drawbacks/risks: historical generated text may retain source information; disclose this distinction. No recovery after chat deletion is offered.
- Costs: bounded dependent cleanup, storage limits and race protection are still needed.
- Reconsider when: owner changes privacy/history requirements.

## ADR-010: Initial hosted chat model and switching

- Status: Approved initial planning choice; operational profile Proposed and runtime validation pending.
- Context: online free-API MVP needs a concrete starting provider with a future switch path.
- Choice: Groq Free / openai/gpt-oss-20b; evaluate openai/gpt-oss-120b if quality requires it. Keep application-owned provider adapter/configuration.
- Alternatives: Gemini free under separately verified compatible data terms; other verified free APIs; local Ollama later.
- Benefits: limited initial integration surface; changeable model without rewriting domain logic or reindexing for chat-only changes.
- Drawbacks/costs: restrictive shared free-token quotas and external model availability; no measured quality yet.
- Risks: privacy configuration, reasoning tokens, provider limits and term changes require validation; no automatic paid or cross-provider fallback.
- Reconsider when: grounded quality, account access or free quota cannot satisfy the pilot.
- Evidence/conditions: [hosted model selection](../03-technical/hosted-model-selection.md).

## Owner decision record — first visit and account defaults

Status: Approved as specified | Date: 2026-11-10

- First-visit color preference: System, following OS light/dark. Initial Cosmic/Minimal appearance remains unresolved; do not infer Minimal approval.
- MVP profile: read-only Google-derived fields.
- Re-registration: a new empty account is allowed only after prior app/provider deletion finishes. No old-data restoration or bypass of pending deletion.
- Benefits: familiar theme behavior, simple identity management and explicit account lifecycle.
- Alternatives/trade-offs: fixed light/dark, editable local profile and permanent re-registration ban were not selected. Read-only profile limits customization; fresh registration does not recover deleted data.
- Risks/costs: system/theme synchronization and identity cleanup races still require verification; operational audit retention remains open.
- Reconsider when: the owner changes appearance, customization or account-lifecycle requirements.

## Owner decision record — Cosmic default and minimal audit retention

Status: Approved | Date: 2026-11-10

- Decision: Cosmic on first visit, System for light/dark, with the header light/dark button and Minimal option retained.
- Decision: seven-day app-controlled operational/security metadata retention; no note/chat content or secrets in logs. Detailed implementation remains Proposed.
- Benefits/trade-offs: recognizable initial visual identity with user control; short debugging window rather than long audit history.
- Scope: owner requested minimal attention/complexity for retention; no separate audit platform. Actual host/provider retention still requires a practical configuration check.
- Reconsider only on concrete owner request or implementation constraint.
