# Architecture decision register

Status: Proposed | Updated: 2026-11-10

The brief selects technologies; these integration decisions are proposals, not owner approvals.

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
- Context/problem: Identity and session lifecycle are unresolved.
- Proposed solution: Evaluate managed Neon Auth first, with Google as the confirmed sign-in method. The auth library/service remains Proposed.
- Alternatives: Self-managed Better Auth or another managed provider.
- Benefits: Potentially fewer operating tasks.
- Drawbacks: Provider integration and quota dependence.
- Costs: MAU/email/session pricing unverified.
- Risks: Callback, cookie and session misconfiguration.
- Reconsider when: Cost, required methods, export or security requirements fail evaluation.

## ADR-005: RAG storage

- Status: Proposed
- Context/problem: Private grounded retrieval must fit a small database.
- Proposed solution: PostgreSQL full-text first; evaluate pgvector in the same database.
- Alternatives: Lexical-only RAG; separate vector service later.
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

The managed versus self-managed auth choice remains Proposed in ADR-004.

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
