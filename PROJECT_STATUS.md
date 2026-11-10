# Project status

Status: Draft | Updated: 2026-11-10 | Phase: architecture initialization

## Completed this session

Repository inspection: empty working tree except .git; main has no commits. Created the requested planning tree, initial vision, proposed MVP, prioritized backlog, architecture overview, decision register, risk register, design direction, and cost assessment. Technical and feature files are intentionally lightweight drafts. No application exists.

## Decisions and blockers

The user selected the technology stack in README.md. Owner confirmed on 2026-11-10: public access, including personal use by the owner and family; $0 starting monthly budget; mock interviews in the next milestone. Separate private accounts and Google sign-in are now confirmed. Authentication library/service, AI providers, and detailed release scope remain unresolved. Anyone can register with Google; no family allowlist or invitation is required. Paid services and automatic paid overages are outside the confirmed budget.

## Next documentation milestones

1. Audience, spending ceiling and interview deferral recorded. Private accounts and Google sign-in are confirmed. Overall MVP review package expanded: PRD, journeys, architecture/data/sequence/deployment diagrams, database constraints, security baseline and release gates. Next resolve the remaining policy/provider decisions and detail the first vertical slice.
2. Specify the first vertical slice: sign-in → create Markdown note → autosave → search → export. Choose auth; define ownership, schema, API contracts, conflict behavior, and acceptance tests.
3. Validate RAG feasibility on paper, then authorize a separate bounded experiment: providers, dimensions, retrieval quality, latency, costs, and ingestion execution.
4. Specify responsive wireframes and tokens; finalize security, deployment, recovery, and release acceptance gates.
5. Request implementation authorization only after the first slice is concrete and reviewable.

## Documentation inventory

Initial drafts: product, system architecture/design, decisions/questions, design system, testing, deployment/costs. Draft placeholders: database/API/auth/RAG and all feature specifications. Deferred designs: MCP execution, offline sync, mock interviews, voice, native apps, analytics, graph. Wireframe/mockup directories contain README placeholders, not finished visuals. No mockups existed at initialization; six visual references were subsequently supplied (see latest update).

Validation: Markdown relative paths and required structure checked after generation. Application tests are inapplicable in this documentation-only repository.

## Knowledge workflow decisions

Confirmed on 2026-11-10: Markdown notes with an editor and preview; flat collections plus tags; individual `.md` import/export and bulk Markdown export. Rich-text editing, nested collections, PDF/Word import and automatic website extraction are deferred. Bulk export packaging and metadata fidelity remain specification details.

## Overall planning package expansion — 2026-11-10

Completed as Draft/Proposed documents: full MVP requirement matrix, main/alternative workflows, conceptual entity/cardinality/transaction design, API operation matrix, security architecture, four Mermaid diagram documents and release readiness gates. Earlier inventory entries describe initialization, not current completeness. These are review drafts, not approved implementation specifications or verified diagrams of deployed services.

Outstanding: auth integration and account-specific limits; AI model/embedding/privacy feasibility; exact storage/rate/input limits and performance objectives; backup implementation, RTO and remaining retention policies; detailed feature specs and responsive wireframes. Current auth recommendation is managed Neon Better Auth, not an approved provisioned service. No implementation, installation or cloud provisioning occurred.

Next smallest milestone: complete the sign-in/notes/organization/search/export feature contracts and wireframes after resolving retention/recovery policy and validating managed auth. AI provider selection may proceed separately; it blocks full AI MVP release, not knowledge workflow specification.

## Confirmed note recovery decisions — 2026-11-10

7-day private Trash with immediate exclusion from normal lists/search/AI retrieval; owner can restore before expiry. Major-failure recovery target: at most 24 hours of lost changes. The backup mechanism is unverified under $0; RTO and backup/account/history retention remain unresolved. See [retention and recovery policy](docs/07-deployment/data-retention-and-recovery.md).

## Visual references reviewed — 2026-11-10

Received six images as enhanceable references only. Documented provenance, retained direction, feature/scope mismatches, missing UI states and proposed responsive screen blueprints. Cosmic/Minimal desktop pairing, purple identity and compact appearance settings inform the design; deferred interviews/MCP/sharing/uploads are not promoted into scope. Original image files remain unmodified in Downloads. Rendered enhanced wireframes, high-fidelity mockups and contrast measurements are still outstanding.

Next design task: produce reviewable desktop/mobile wireframes for the capture/search/export/Trash journey and tie each state to feature acceptance criteria. See [reference review](docs/05-design/reference-review.md).

## Interactive wireframe review — 2026-11-10

Prepared an in-conversation desktop/mobile review of six screens: sign-in, dashboard, editor, knowledge/search, import/export and Trash, with appearance and scenario controls. This is an illustrative UI design draft only, separate from application implementation. Remaining detailed states and runtime/accessibility QA are tracked in the wireframe README. Next: review the layouts with the owner, then refine detailed states and feature contracts.

## Wireframe direction accepted — 2026-11-10

Owner accepted the current wireframes as the starting design direction; visual enhancements are deferred to a later update. shadcn/ui remains confirmed as the component foundation. Next planning milestone: complete the first workflow's feature specifications and concrete data/API/acceptance contracts using this design baseline. Auth/provider feasibility and release gates remain outstanding. Application implementation still requires explicit authorization.

## First workflow specification completed as Proposed — 2026-11-10

Added end-to-end behavior for public Google sign-in, minimal dashboard, notes/autosave/conflicts, flat organization, notes-only search, Markdown import/export and 7-day Trash. Defined concrete service/transfer contracts, atomic quota/idempotency rules, Proposed resource limits, export fidelity and an 18-scenario acceptance matrix. References and AI remain in overall MVP scope but outside this first implementation slice. No application code, packages, databases, commits or deployments were created.

Next smallest planning task: validate managed Neon Better Auth Next.js integration, public Google configuration and account-specific free-tier requirements, then record the recommended auth/driver integration decision. Production release remains gated on global limits, purge scheduling, backup validation, account deletion and remaining privacy policies. The owner has not yet authorized implementation.

## Git checkpoint and handoff — 2026-11-10

Owner explicitly authorized an initial Git commit and push, superseding the earlier no-commit/no-push restriction for this checkpoint only. Planning was paused at the owner's request; the owner subsequently requested Resume (see latest checkpoint). No application implementation has been authorized.

Resume here: validate managed Neon Better Auth's current Next.js integration, public Google OAuth production configuration and free-tier requirements, then finalize auth/driver recommendations. The first-workflow specification/contracts and accepted initial wireframe direction are ready for review. See the outstanding release gates before implementation or public launch.

Git was already initialized on main with no commits or remote. Initial local checkpoint and remote push status must be confirmed from Git rather than assumed from this handoff entry.

## Resumed: auth and driver validation — 2026-11-10

Owner resumed planning. Verified live official Neon, Google and Drizzle documentation; recorded managed Better Auth/Google Next.js integration and transaction-capable driver recommendations in docs/03-technical/auth-integration-validation.md. The provider recommendation remains Proposed. Public Google setup requires app-owned credentials and matching callback/trusted origins. Session cache semantics, SMTP applicability, account-specific quotas and runtime tests remain release checks. No implementation, package install, provisioning, commit or push occurred this turn.

Next smallest planning milestone: specify account deletion/session blocking and historical source/backup retention, then validate the $0 backup/purge execution plan. AI provider evaluation remains pending before full MVP release. Auth/driver recommendations are reviewable now, but production and runtime feasibility are not yet proven.

## Lifecycle and recovery planning — 2026-11-10

Drafted account deletion/session blocking, historical chat/source handling and a backup/cleanup feasibility plan. Account deletion and backup-retention defaults are Proposed pending owner answers. Confirmed note Trash and 24-hour RPO are unchanged. Exact logical expiry is enforced independently of physical purge scheduling. A dependable $0 independent backup, deletion journal, executor/storage/key recovery and measured RTO remain unverified; do not claim public production recovery readiness. No resources provisioned, packages installed or application code implemented.

Next: record owner policy answers, evaluate the available backup execution/storage environment, and decide the remaining historical-excerpt policy before public release. Detailed knowledge workflow work can proceed in parallel once implementation is explicitly authorized.

## Account/backup policy confirmation — 2026-11-10

Owner approved immediate account access blocking and live-data removal targeted within seven days, with no account recovery grace period; encrypted backup retention is seven days. Previous pending-policy entries are historical. Operational implementation remains Proposed/unverified. Note Trash and RPO targets are unchanged. Historical excerpt handling, RTO, independent deletion journal and backup executor/storage remain open. No commit/push, provisioning or application implementation performed.

Next smallest milestone: evaluate the operator's available backup storage and execution environment against the approved retention and 24-hour RPO; keep it distinct from future AI-provider planning.

## Scope update: backups deferred — 2026-11-10

Owner chose to leave backup hosting undecided, then explicitly moved application-managed backups/disaster recovery beyond MVP. Earlier entries treating independent backup/restore evidence as MVP blockers are superseded. Future targets remain 24-hour RPO and seven-day encrypted retention; no MVP recovery guarantee. Note Trash, export/import, account-deletion blocking/live cleanup remain in scope and still need reliable cleanup execution. No backup resources or workflow were created.

Next smallest milestone: complete the references and dashboard specifications, then define grounded-chat behavior/provider evaluation for the overall MVP. Backup research/setup is deferred until the owner brings that milestone into scope.

## References and Dashboard detailed specifications — 2026-11-10

Replaced placeholders with detailed Proposed contracts: manual reference CRUD, URL validation/normalization, owner-only duplicate detection, revision conflicts, note links, search/views/quotas; and bounded private Dashboard summaries, first-use/partial-error states, quick actions and conditional AI availability. Added 11 reference and 10 dashboard acceptance scenarios; linked API/data/testing documents. Reference deletion policy is awaiting owner input; immediate deletion is a recommendation only. No application code, installs, provisioning, commit or push performed.

Next: incorporate the reference-deletion answer, then detail AI Chat/RAG conversation/source semantics and evaluate free-provider constraints. Do not reopen backup hosting selection: backups remain future scope.

## Reference deletion confirmed — 2026-11-10

Owner approved immediate reference removal after confirmation, without Trash. Linked notes remain; reference associations and current search/retrieval sources are removed. Earlier pending-policy entries are superseded. Notes retain their separate seven-day Trash policy. Next milestone: AI Chat/RAG detailed specification and provider-feasibility evaluation. No implementation or Git mutation performed.

## Optional online/local AI planning — 2026-11-10

Owner requested both free hosted models and local AI. Added provider-options document with candidate evidence, explicit privacy/provider selection, no paid fallback, and local-versus-hosted networking boundaries. Runtime/model and whether the hosted app should access the owner's machine are awaiting answers. No local model inspection, endpoint exposure, configuration change, packages or provisioning occurred. Backups remain deferred.

Next: incorporate local runtime/access answers and finish detailed chat/RAG contracts (citations, persistence, failure/quota handling and evaluation); choose an exact hosted model only after free API/privacy verification.

## Online AI first — 2026-11-10

Owner identified Ollama/Qwen ~7B as the local runtime/model family and explicitly deferred local integration. Pending local-access questions are closed for this milestone. Current focus is online models with free API access, grounded chat contracts, privacy and shared quota controls. Local endpoint/model inspection and bridge design are deferred. Exact hosted provider remains undecided.

## Online-model AI Chat/RAG detailed specification — 2026-11-10

Expanded chat specification and contracts: provider disclosure, bounded input/history/retrieval, citations and source freshness, streaming/partial persistence, idempotency, retries/cancellation, user/global quotas, source-change and account-deletion races, plus 15 acceptance scenarios. Replaced RAG placeholder with versioned ingestion/lexical-first retrieval and conditional vector upgrade plan. Added synthetic evaluation corpus/Proposed quality gates. No provider selected, model calls, package installation, provisioning or application implementation. The late generic reply to a previous local-access question does not override the owner's explicit online-first/local-future direction.

Next: owner decisions on chat history/deletion and historical excerpts, then choose an exact free hosted provider/model after privacy/quotas review. Backup and local inference remain outside MVP.

## Chat retention confirmed — 2026-11-10

Owner approved history until deletion, conversation removal without Trash, and preserving existing generated answer text after source deletion until its conversation is deleted. Source retrieval/citation access stays blocked after deletion. Earlier pending chat-policy entries are superseded. Updated chat/API/lifecycle/RAG and scope documents; technical cleanup and quality gates remain Proposed. No implementation, model call, provisioning, commit or push.

Next smallest milestone: compare exact hosted free-API model candidates against privacy, quality and shared quota requirements; record a recommendation without assuming credentials or performing live private-data inference. Local AI and backups remain future scope.

## Initial hosted-model planning choice — 2026-11-10

Owner authorized proceeding with an initial switchable choice. Recorded Groq Free / openai/gpt-oss-20b, with GPT-OSS 120B as an evaluated alternative rather than automatic fallback. Verified official model/limit/privacy/billing documentation, flagged Gemini unpaid-term concerns for private knowledge, and proposed lower shared-budget pilot caps. Quality, credentials, actual Free account limits and ZDR remain unverified. No model call, package installation, configuration/provisioning, commit or push.

Next smallest milestone: consolidate the planning documents into a current decision/readiness summary and ordered implementation backlog, removing stale pending-decision language. Runtime setup and evaluation occur only after explicit implementation authorization; local AI/backups remain deferred.

## Planning consolidation — 2026-11-10

Created docs/02-architecture/planning-readiness.md as a current decision/coverage/readiness summary and docs/01-product/implementation-backlog.md as the ordered planning/build/release task breakdown. Documents were authored sequentially, with existing completed specifications preserved. Corrected the milestone backlog's outdated recovery-drill wording so deferred backups do not become an MVP dependency.

Unresolved: managed-auth/driver proposal acceptance, provider runtime/privacy verification, exact global quotas, transport/ZIP implementation choices and post-deletion re-registration policy. No implementation, dependency installation, provisioning, commit or push.

Next recommended task: PLAN-01, expand Knowledge Base's umbrella specification for combined notes/reference search, result types, ranking/filter/cursor semantics and owner/deletion behavior; then PLAN-02 Settings/account workflow. Do not regenerate completed feature contracts or reopen future backup/local-AI scope.

## PLAN-01 and PLAN-02 detailed drafts — 2026-11-10

Completed sequentially: expanded Knowledge Base umbrella specification with mixed note/reference ranking, AND filters, discriminated results, cursor/page semantics, deletion/privacy and 12 acceptance cases; created Settings/account specification with profile, appearance, data links, provider disclosure, logout, deletion confirmation/status and 12 acceptance cases. Existing dependent note/reference/chat contracts were preserved. Updated readiness coverage to reflect these drafts. No implementation, installation, provisioning, commit or push.

Unresolved product proposals: first-visit Minimal + System appearance, read-only Google profile, and re-registration as a new empty account only after completed deletion. Technical review remains for auth freshness/SMTP, transaction driver, exact search rank/cursor support, global quotas, cleanup execution and operational audit retention.

Next recommended task: PLAN-03, write the narrowly scoped foundation implementation proposal (files/responsibilities, dependency/version validation approach, shared shadcn tokens, checks and authorization boundary). Obtain owner choices on the small Settings defaults before treating them as approved. Application implementation remains unauthorized; local AI and backups remain deferred.

## PLAN-03 foundation proposal — 2026-11-10

Created docs/02-architecture/foundation-implementation-proposal.md, defining BUILD-01 scope, intended file responsibilities, safe scaffold/dependency-validation approach, shadcn/token/appearance contract, responsive navigation and completion evidence. Existing completed feature specifications were preserved. PLAN-03 is complete as a Proposed review document, not an implementation authorization. No application files, dependencies, cloud resources, commits or pushes were created.

Remaining owner choices: first-visit Minimal + System default, read-only Google profile and empty-account re-registration after completed deletion. Managed auth/driver and other technical proposals retain their individual statuses. Next recommended step: review these small defaults and the foundation proposal; implementation requires explicit owner authorization afterward. Operational audit retention remains a targeted planning gap; backups/local AI remain future scope.

## Settings defaults confirmed — 2026-11-10

Owner chose System for first-visit light/dark preference, approved read-only Google profile and fresh empty-account re-registration after completed app/provider deletion. Initial Cosmic/Minimal visual appearance is not selected by System and remains unresolved. Updated only affected planning documents; no implementation, install, provisioning, commit or push.

Next: resolve initial Cosmic/Minimal appearance and minimal operational audit retention, then review the foundation proposal before any explicit implementation authorization. Existing auth/driver and runtime-validation proposals retain their statuses.

## Quick light/dark button — 2026-11-10

Owner requested a light/dark button. Recorded a shared accessible header control with Proposed toggle behavior: first visit System, button selects opposite resolved theme explicitly, and Appearance settings restore System. Updated affected design/settings/foundation docs only. Cosmic/Minimal initial appearance remains separate/unresolved; no implementation or Git mutation.

## Operational audit-retention draft — 2026-11-10

Created docs/07-deployment/operational-audit-retention.md as one focused planning document. Defined metadata-only diagnostic/security events, prohibited content/secret logging, bounded receipts/quota/deletion-work state, expiry/access rules, deletion/re-registration handling and six verification checks. Proposed seven-day app-controlled diagnostic/security retention awaits owner approval; actual host/provider retention must be validated. Existing note/chat/account policies are unchanged.

Remaining owner choices: initial Cosmic/Minimal appearance (color preference System is already approved) and seven-day operational-metadata ceiling. Next recommended step: settle these choices, then review foundation scope/auth/driver proposals before any explicit implementation authorization. No implementation, packages, provisioning, commit or push.

## Final UI/metadata defaults confirmed — 2026-11-10

Owner approved Cosmic as first-visit visual appearance and seven-day operational/security metadata retention; System light/dark and header switch remain. Requested minimal further retention planning. Settings default questions are resolved; existing detailed auth/driver/implementation proposals retain their own statuses. Updated affected documents only, without regenerating specifications. No implementation, install, provisioning, commit or push.

Next recommended step: review/accept the foundation implementation proposal and technical integration recommendations; application work still requires explicit authorization. Keep operational metadata lightweight, and leave local AI/backups deferred.

## Planning pause and Git checkpoint — 2026-11-10

Owner requested committing/pushing the current documentation with Codex attribution, then continuing later. Planning is paused at the owner's request. Latest confirmed defaults: Cosmic + System first visit, light/dark header button, read-only Google profile, fresh empty-account registration after completed deletion and minimal seven-day operational-metadata retention. Online AI initial choice is Groq Free/GPT-OSS 20B, pending actual account/privacy/quality checks. Local Ollama/Qwen and backups remain future scope.

Resume task: review docs/02-architecture/foundation-implementation-proposal.md and technical auth/driver proposals, then obtain explicit application-implementation authorization before BUILD-01. Planning completion estimate was informal, not an audited readiness percentage. No application code or infrastructure exists. Continue one document/task at a time, avoid re-reading unchanged files and keep output concise.

This entry records authorization and handoff, not a self-verifying push claim; use Git branch/remote state to confirm the checkpoint.
