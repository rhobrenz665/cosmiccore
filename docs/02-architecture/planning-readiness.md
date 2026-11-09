# Current planning readiness

Status: Draft review checkpoint | As of: 2026-11-10

This document summarizes current decisions and remaining gates. It does not approve technical proposals or authorize implementation. Earlier dated entries in PROJECT_STATUS.md and other documents are historical; apply later explicit owner decisions where they supersede an earlier proposal. This summary links to detailed specifications rather than replacing them.

## Approved product baseline

| Area | Current direction | Detail |
|---|---|---|
| Audience | Anyone can register with Google; separate private accounts | No family allowlist, invitations or sharing |
| Budget | $0 starting operating budget | No paid fallback, billing upgrade or automatic provider switch |
| Notes | Markdown editor/preview, flat collections and tags | Rich text and nesting deferred |
| Portability | Individual .md import/export and bulk Markdown export | ZIP packaging and metadata fidelity are Proposed implementation details; not a full backup |
| Note deletion | Seven-day private Trash; restore before expiry | Immediate exclusion from normal lists/search/RAG |
| Reference deletion | Immediate live removal after confirmation; no Trash | Linked notes survive |
| Account deletion | Immediate app-access block; live removal targeted within seven days | No account recovery grace period; provider/cleanup mechanics unverified |
| Chat retention | History until user deletion; deletion without Trash | Account deletion overrides retention |
| Historical answers | Existing generated text remains after source deletion until conversation deletion | Source retrieval/citation access is blocked; no automatic prose redaction |
| Hosted AI | Initial Groq Free / openai/gpt-oss-20b choice | GPT-OSS 120B is an evaluation alternative, not automatic fallback; runtime quality untested |
| UI foundation | shadcn/ui, Tailwind CSS, Lucide, one shared component system | Cosmic/Minimal, each with light/dark/system; initial wireframes accepted as direction |

The owner selected Next.js App Router, React/TypeScript, Neon PostgreSQL and Drizzle/Kit. [ADRs](architecture-decisions.md) distinguish these selected technologies from Proposed integration details.

## Deferred capability boundaries

Mock interviews are next milestone. Local Ollama/Qwen ~7B, automated backups/disaster recovery, MCP execution, sharing, offline sync/native apps, voice, analytics/graph and automatic web/file extraction are future scope. Do not reinterpret screenshots as approval to add them.

The approved 24-hour RPO and seven-day encrypted backup retention belong to the future backup milestone. They do not block MVP as backup requirements or establish a current guarantee. Note Trash, Markdown transfer, safe migrations, account cleanup and operational error handling remain MVP responsibilities. Backup-specific deletion journals and restore drills are future work; do not require building them to deliver this MVP.

## Proposed architecture baseline

One modular Next.js deployment owns UI and trusted services. Server Components read private data through authorized services; Server Actions mutate first-party forms; Route Handlers handle auth proxy, transfers and streaming. Every boundary validates session, active account and ownership. Private data is excluded from shared caches/logs.

Recommended auth: Neon managed Better Auth with Google-only shadcn/ui sign-in. This remains Proposed, not an owner-approved configured service. Recommended driver: transaction-capable Neon Pool/Client with Drizzle neon-serverless in Node runtime. Exact compatible stable versions and runtime behavior remain to be validated.

RAG begins with versioned owner-scoped chunks and an evaluated lexical baseline. Vector/embedding integration is conditional on measured retrieval quality; no embedding model/dimension is selected. Groq chat configuration is replaceable without reindexing; an embedding-model change requires a new space and reindexing. No separate backend, queue, vector database or gateway is selected.

## Documentation coverage

| Area | Reviewable material | Remaining work |
|---|---|---|
| Product | [PRD](../01-product/prd.md), scope, workflows and backlog | Keep latest scope amendments visible during implementation planning |
| Overall design | [System architecture](system-architecture.md), diagrams, security baseline | Runtime validation; resolve technical proposals before related tasks |
| First knowledge slice | [Workflow](../04-features/first-workflow/spec.md) and contracts | Review Proposed limits/ZIP behavior; finalize driver/auth integration |
| References | [Detailed spec](../04-features/references/spec.md) | Implementation validation; combined resource search contract |
| Dashboard | [Detailed spec](../04-features/dashboard/spec.md) | Runtime query budget and final component states |
| Chat/RAG | [Chat](../04-features/ai-chat/spec.md), contracts, RAG design, evaluation | Model access/privacy settings, tokenizer/transport, grounding tests |
| Identity lifecycle | [Account lifecycle](../03-technical/account-lifecycle.md) | Fresh authentication and provider cleanup; empty-account re-registration approved |
| UI | Reference review, accepted preview direction and text blueprints | Detailed selectors/conflict/import/source states and accessibility QA |
| Release | [Release gates](../07-deployment/release-readiness.md), costs/deployment | Account-specific service configuration, global caps, cleanup execution |

“Reviewable” does not mean approved implementation contract or tested running software. Authentication, database/API and testing documents have been expanded but remain Proposed where their specifics are unsettled. Knowledge Base's combined-search specification and Settings/account workflow are now detailed Proposed drafts; their new defaults still need review. Avoid regenerating completed dependent specs.

## Remaining decisions by when they matter

### Before related implementation

- Auth integration acceptance: managed Neon Better Auth versus self-managed alternative; exact stable SDK/Next.js compatibility and supported session/reauth APIs.
- Transaction driver acceptance and connection lifecycle; exact schema constraints/migration ownership.
- Chat transport: custom SSE contract or documented SDK protocol, never an accidental mixture.
- Proposed quotas, import/export ZIP limits and error behavior; global caps must reflect actual accounts, not guessed public capacity.
- Approved defaults: Cosmic first-visit appearance, System color preference, read-only Google profile, fresh empty-account re-registration after completed deletion and seven-day operational/security metadata retention. Keep metadata logging minimal; actual provider settings remain deployment checks.
- Knowledge search across notes AND references: unified ranking/filter/pagination semantics without confusing source types.

### Before public release, not a reason to provision during planning

- Own production Google OAuth app, trusted origins, external audience, privacy/support pages and managed-auth SMTP applicability.
- Actual Groq Free access/limits, ZDR/disclosure settings and completed synthetic quality/security evaluation. No model call has verified quality.
- Hosting use eligibility, separate environments and no-cost exhaustion behavior; reliable note/account cleanup plus overdue-work visibility.
- Isolation/concurrency/accessibility tests, approved secret handling, safe migrations and application incident response.

### Future milestones only

Backup hosting/storage/execution, RTO/restore drill/deletion reconciliation, Qwen model tag/local bridge, interview rubric, MCP permissions and offline synchronization. Reopen only when the owner changes scope.

## Recommendation

Recommendation: finish the small cross-feature planning gaps, then review the first foundation task as a concrete implementation proposal. Reason: most core feature specifications are already detailed; finishing every future system would delay the MVP. Trade-offs: exact provider/runtime constraints still require implementation-time verification. MVP impact: review the completed Knowledge Base/Settings drafts and resolve their remaining product defaults, without revisiting backup hosting.

No application implementation is authorized. No packages/resources/tests have been executed by this readiness checkpoint. The ordered task breakdown is maintained in the [implementation backlog](../01-product/implementation-backlog.md).
