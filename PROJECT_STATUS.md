# Project status

## Latest checkpoint — production release testing — 2026-11-28

Production Google sign-in passed after credential rotation. The production migration journal contains all 11 migrations through 0010. With temporary global limits configured, Safari verified note creation, autosave after reload, Knowledge search and a single-note Markdown download. Signed-out users were redirected from protected pages and received 401 for export endpoints. A second signed-in account could not find, open or individually export the synthetic test note, and its ZIP excluded that note.

Hosted AI is enabled in production. Safari verified default unchecked consent in Notes and Chat, a grounded note answer with its excerpt, a chat refusal before indexing, and a grounded chat answer with a citation after indexing, including persistence after reload. A second signed-in account received Conversation unavailable from the owner’s direct chat link. The second account asked the same question in a separate conversation and received an insufficient-evidence response without the answer or citation. The owner approved clearing all app data and Neon Auth users and sessions. The reset and fresh migration have not run. Preflight identified 18 public tables, one Drizzle journal table, and nine provider-owned Neon Auth tables. See [release readiness](docs/07-deployment/release-readiness.md).

## Local release testing — 2026-11-27

**Current mode: release verification.** GitHub `development` is the integration branch. Reviewed changes advance to `main` for production. Settings now explains what chat and note answers send to Groq. All 30 automated tests, lint, the optimized build, and typecheck passed on 2026-11-27.

**Safari:** The signed-in test account showed the updated Settings disclosure. The existing test conversation showed matching Groq consent wording with the checkbox unchecked by default.

**Production target identified:** Safari confirmed the CosmicCore Neon project (`sparkling-band-70816389`), default branch `main` (`br-nameless-pond-a1kuek3d`). The development database is in a separate project.

**Remaining:** Link the production host, verify Neon/Auth configuration, and the outstanding acceptance checks in [release readiness](docs/07-deployment/release-readiness.md). The one-time production database reset and fresh migration follow successful production testing.

Status: In progress | Updated: 2026-11-27 | Phase: build/setup planning

Latest checkpoint: BUILD-11 is on `codex/build-11-hosted-chat`, based on merged main. Hosted chat now retrieves up to three current indexed sources, validates exact cited passages, persists answers, streams provider progress, supports cancellation, and records reported token counts. Migrations through 0010 are applied in isolated development. Signed-in Safari has verified note/reference answers, mixed-source citations, reload persistence, usage cooldown feedback, cancellation, and cross-account denial. Remaining work includes deciding lexical paraphrase expectations, any partial-output recovery build, and production release gates. See the [implementation backlog](docs/01-product/implementation-backlog.md).

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

## BUILD-01 local foundation — 2026-11-10

Owner explicitly authorized implementation with “Ok proceed.” Added a local Next.js 16.4.6 / React 19.3 / TypeScript application using Tailwind 4.3, current shadcn/ui Base UI components and Lucide. The shared shell has responsive desktop/sidebar and mobile bottom/More navigation, all planned foundation routes, safe loading/error/not-found views, and Cosmic/Minimal plus light/dark/system browser-local preview controls. First visit defaults to Cosmic + System; the header button selects the opposite resolved color. Route content is clearly labeled as a local interface preview. No auth, database, private user data, inference or cloud service was connected.

Verification: `npm run typecheck`, `npm run lint`, and `npm run build` passed. The build uses Next.js Webpack with Tailwind PostCSS because the generated Turbopack CSS worker could not bind a local port in this environment. Browser review checked dashboard and settings, 320px layout without horizontal overflow, mobile More sheet, and preference persistence after reload. `npm audit --omit=dev` reported zero production dependency advisories. Full dependency audit still reported development-tool advisories; evaluate them before CI/production setup. Browser review did not establish full WCAG contrast or screen-reader certification. Existing planning documents were preserved.

Next smallest milestone: review and authorize BUILD-02 Google sign-in and stable internal user mapping, including a minimal `app_users` migration needed by identity mapping. Resolve the stale ADR/readiness wording before treating it as an implementation contract. Production OAuth credentials, session freshness and two-account isolation need runtime verification. No provisioning, commit, push or deployment was performed in BUILD-01.

## Foundation Git checkpoint — 2026-11-11

Owner requested continuing the push. Verified earlier planning commits already match GitHub main, then prepared the existing uncommitted BUILD-01 foundation for the next checkpoint without adding application functionality. Re-ran typecheck, lint and production build successfully; checked candidate source/configuration files for credential patterns with no matches. No auth/database/model/provider service was connected or provisioned. Resume at BUILD-02 proposal review/authorization; current foundation remains a local UI preview. Git state must confirm publication, not this entry alone.

## BUILD-02 Google identity implementation — 2026-11-14

Owner explicitly authorized the next feature with “Ok lets do it.” Created and linked an isolated CosmicCore Neon development project in AWS Singapore and enabled Managed Better Auth. Added the supported `@neon/auth` Next.js proxy/client integration, Google-only sign-in UI, safe internal return paths, protected workspace middleware, server-side session enforcement, visible account/sign-out controls and clear auth failure states. Landing/sign-in remain public; workspace routes require a session.

Added the narrow application-owned identity slice: Drizzle schema and generated migration for `app_users`, with an internal UUID, unique auth issuer/subject identity, read-only Google profile projection and active/deletion-pending/blocked status. Workspace entry performs an atomic upsert, so concurrent first loads converge on one internal user. Managed `neon_auth` tables remain provider-owned. Broader domain schema and BUILD-03 quota/ownership tables were not pulled forward.

Verification: `npm run typecheck`, `npm run lint` and the production build pass. Local HTTP checks returned 200 for `/` and `/auth/sign-in`, and 307 from signed-out `/dashboard` to `/auth/sign-in`. The generated migration still requires the owner's manual `drizzle-kit migrate` step. A live Google round trip, returning-user session restore, canceled consent, logout/account switching and two-account isolation remain unverified. Production also requires app-owned Google OAuth credentials, trusted domains and localhost disabled. The current official SDK tree has an upstream peer mismatch (`@neon/auth` pins `@better-fetch/fetch` 1.3.2 while its resolved OAuth plugin requests 1.3.3); typecheck/build pass, but `npm ls` reports it. Production audit also reports four moderate advisories in Drizzle Kit's development-only legacy esbuild chain; no force downgrade was applied.

Next smallest milestone: apply and verify the `app_users` migration, complete one development Google sign-in/sign-out/reload flow using Neon's shared development credentials, then test a second Google account and record actual session behavior. Only after BUILD-02 runtime acceptance should BUILD-03 expand the private data schema and ownership tests. No commit, push or deployment was performed.

## BUILD-02 PR handoff — 2026-11-15

Owner requested a compact checkpoint and PR with Codex co-authorship. Package the existing BUILD-02 changes for review; no additional application features, migrations or provisioning are authorized by this checkpoint. Typecheck, lint and production build passed again. Local environment secrets and the machine-local `.neon` project link are excluded from the commit.

Current state: Google sign-in integration, protected workspace and internal identity migration are implemented; knowledge features remain previews. Open checks: apply the migration, exercise Google sign-in/sign-out/reload and two-account isolation, validate session revocation, and configure production OAuth. Review the authenticated unavailable-account redirect path during runtime acceptance: sign-in currently redirects any existing session back to the workspace. Existing dependency peer/advisory findings remain recorded above.

Smallest next milestone: apply and verify the development migration, then complete one real Google sign-in/sign-out/reload flow before BUILD-03. PR publication is verified through GitHub, not inferred from this handoff.

## Safari local sign-in investigation — 2026-11-15

Observed Google account chooser opening in Safari, followed by the owner's reported return to the public “Welcome back” sign-in page on HTTP localhost. Reproduced the public sign-in state in Safari. The OAuth API returned 200 with a redirect URL, and following that URL reached Google. The installed SDK requires Secure cookies for its OAuth challenge and session; Safari's lack of an HTTP localhost exception is the leading cause of the missing session. No authenticated dashboard success has been established, and callback/database causes have not been fully ruled out.

Added `npm run dev:https` and documented Safari's HTTPS requirement and owner-controlled certificate trust setup. No certificate authority installed, database migration applied, commit or push performed. Next smallest milestone: start a trusted local HTTPS server, repeat Google sign-in in Safari and inspect dashboard/reload behavior; verify the application identity migration if dashboard entry fails afterward.

## Cross-browser sign-in root cause — 2026-11-15

The owner confirmed the failure also occurs in Chrome. A temporary diagnostic found a Chrome session-token cookie but no valid upstream session; changing the Origin header did not restore it. The decisive finding was that root `proxy.ts` was ignored because this project uses `src/app`: existing production middleware/function manifests had no registered proxy, and a request did not execute temporary proxy instrumentation. Consequently Neon's OAuth verifier exchange never ran, and the server session guard returned users to sign-in. Moved the unchanged auth proxy configuration to `src/proxy.ts`. Next.js now compiles the proxy and a signed-out request to a diagnostic protected path receives 307 to sign-in. Removed temporary diagnostic endpoint and instrumentation. The prior Safari transport explanation is an additional local constraint, not the complete cross-browser root cause.

Read-only SQL also confirmed `public.app_users` is absent. That is a separate authenticated dashboard blocker; no migration was applied in this diagnosis. Smallest next milestone: apply the reviewed development identity migration and verify a fresh HTTPS Google round trip, dashboard entry, reload and sign-out. No commit or push performed.

Validation: the same build-manifest assertion failed before the move and passed afterward. Production build now lists “Proxy (Middleware)”; lint, typecheck and Git whitespace checks pass. A full authenticated Google-to-dashboard flow remains unverified pending the database migration and a new sign-in.

## Development identity migration applied — 2026-11-15

Owner explicitly authorized applying the migration. Verified that the direct migration URL targets the same database as the application connection, then ran `npm run db:migrate` successfully. Verified `public.app_users` through the application connection: nine columns, primary key, active/deletion-pending/blocked status constraint, unique issuer/subject index and email index. Drizzle records one applied migration. Managed auth tables were not modified by this migration. No additional domain tables, commit or push were created.

The missing identity-table blocker is resolved. The owner subsequently confirmed the dashboard is working. Session restoration after reload, sign-out/sign-in, and two-account isolation remain unverified.

## Authentication fix PR checkpoint — 2026-11-15

Owner requested a PR with Codex co-authorship for the proxy location fix, local HTTPS command and troubleshooting/migration evidence. Dashboard access is owner-confirmed after the proxy fix and development migration. No new migration is introduced by this PR; other environments still require the existing identity migration. Build, lint, typecheck, proxy registration and documentation-link checks passed during this work. Next smallest milestone: verify dashboard reload and sign-out/sign-in, then account isolation. Machine-local Neon configuration and environment/certificate secrets remain excluded.

## BUILD-03 Step 2 — local schema and migration review — 2026-11-15

Owner requested BUILD-03 in individually approved steps with manual operations delegated to them. Owner reported the requested sign-out, protected dashboard, sign-in/reload and available account-switching checks working as expected; this is owner-reported browser evidence, not proof of private-data isolation. Owner then explicitly authorized Step 2. Added ten application tables for notes, references, collections, tags, owner-matched associations, account/global usage and 24-hour mutation receipts. Added size/revision/Trash constraints, generated normalized names/content-byte counts and relevant indexes. Generated additive `0001_knowledge_storage.sql` and snapshot; existing identity/auth tables are unchanged. See [schema review](docs/03-technical/build-03-schema-review.md) for exact boundaries and manual handoff.

Validation: migration generation, TypeScript, lint, production build and Git whitespace checks pass; SQL reviewed for referenced-key ordering and additive scope. No local PostgreSQL executable is available; actual migration execution and database constraints/concurrency are unverified. Quota ceilings, active-account checks, URL parsing, transactions, replay/cleanup and owner-scoped service enforcement remain pending. No new UI or endpoint accesses these tables. No packages installed, database migration applied, provisioning, commit or push performed. Existing untracked `.neon` file preserved.

Smallest next milestone: owner review/approval of Step 3, then owner runs the existing `npm run db:migrate` against the intended development database and reports redacted results. Verify tables/migration tracking before asking to start Step 4. Do not continue automatically.

## BUILD-03 Step 3 — manual migration verified — 2026-11-15

Owner ran `npm run db:migrate` and reported that the shell prompt returned after the WebSocket driver warning. Read-only queries through the application's existing development connection confirmed all ten new tables alongside app_users, two Drizzle migration records and a stored hash matching the local `0001_knowledge_storage.sql` SHA-256. The migration is applied despite the absence of a reported success message. No application data was read or modified during verification. The Neon connector could not access the linked project; verification used the existing application connection instead.

Smallest next milestone: obtain explicit approval for Step 4 (authorized data access, transaction driver, quota enforcement and retry protection). Actual isolation, rollback and concurrency tests remain pending. No Step 4 implementation, additional migration, commit or push performed.

## BUILD-03 Step 4a — transaction support — 2026-11-15

Owner approved proceeding with Step 4 after discussion of transaction support as the first small part, preserving approval pauses and manual verification. Added a server-only `withDbTransaction` entry point over a per-operation Neon WebSocket Client/Drizzle transaction, bounded connection/query/lock/idle settings, finally-based connection cleanup and content-free connection diagnostics. Existing HTTP identity access is unchanged. Added `npm run db:check-transactions` for the owner to verify temporary-table commit, synthetic-identity rollback after callback and SQL failures, and subsequent successful transactions. No permanent test records are intended to commit. Native WebSocket and the manual TypeScript runner require a current Node 22+ runtime; local Node is 25.8.1. No new dependency or migration.

Verification: TypeScript, lint, production build, script syntax and Git whitespace checks pass. A TypeScript check raced the build's generated-type cleanup; rerunning after build passed. Live database transaction checks were deliberately left to the owner; connection-loss behavior, authorization/isolation, quota races and receipt behavior remain unverified. See [transaction support and manual check](docs/03-technical/build-03-transactions.md). No new public feature/action, database operation, package install, provisioning, commit or push performed.

Smallest next milestone: owner runs `npm run db:check-transactions` in the development environment and reports the result; then ask approval before Step 4b (active-account checks and owner-scoped data services). Quota and receipt enforcement follow in separately reviewed parts. Do not mark BUILD-03 or Step 4 complete yet.

## BUILD-03 Step 4a — owner runtime verification passed — 2026-11-15

Owner supplied all three PASS lines and the final success message from `npm run db:check-transactions`, confirming the manual development commit and rollback scenarios described above. Node's CommonJS/ES-module reparse warning was informational; no package-wide module change was made. This evidence does not establish connection-loss handling, ownership isolation or quota/receipt concurrency.

Smallest next milestone: obtain owner approval for Step 4b — active-account checks and owner-scoped data services. No further implementation, database operation, commit or push performed in recording this result.

## BUILD-03 Step 4b — active accounts and private reads — 2026-11-15

Owner explicitly approved this part. Added a server-only session-derived private-data wrapper and fixed resource getters for notes, references, collections and tags. The shared database core locks the internal account FOR SHARE, rejects nonactive/missing accounts, enforces owner predicates and hides Trash. Valid foreign/missing IDs share a generic NOT_FOUND; malformed UUIDs fail validation. Added bounded owned collection/tag validation with target locks and a manual two-owner database check that rolls back all synthetic fixtures, including five cross-owner relationship constraint cases and blocked/deletion-pending account checks.

Hardened identity profile upsert to update existing mappings only while active. Fixed the existing-session unavailable-account redirect loop and supplied sign-out for account switching. No feature mutation, new endpoint, quota/receipt enforcement, schema change or migration was added. Private getters are internal primitives, not complete feature APIs. Existing unrelated/uncommitted work and `.neon` remain preserved.

Verification: TypeScript, lint (no warnings), production build, script syntax and documentation/Git whitespace checks pass. Agent did not run live database checks. Actual two-owner core behavior awaits owner execution; session-backed blocked-account UI, concurrent block/write behavior and quota/receipt races remain unverified. See [Step 4b review/manual check](docs/03-technical/build-03-ownership.md).

Smallest next milestone: owner runs `npm run db:check-ownership` on development and confirms normal dashboard reload/sign-out/sign-in. After results, ask approval before quota and retry enforcement. Step 4 and BUILD-03 remain incomplete. No package installation, provisioning, database operation, commit or push performed.

## BUILD-03 Step 4b — owner runtime verification passed — 2026-11-15

Owner supplied the three ownership PASS lines and confirmed the final rollback success message plus normal dashboard reload/sign-out/sign-in. Shared-core own/foreign access, association constraints, Trash exclusion and nonactive-account denial passed the manual script; all synthetic fixtures were rolled back. Concurrent blocking, blocked-session UI and quota/receipt concurrency remain unverified.

Smallest next milestone: obtain explicit approval for Step 4c — atomic per-account/global quota enforcement and mutation retry receipts, with manual checks supplied to the owner. No implementation beyond Step 4b or database operation performed while recording these results. Step 4 and BUILD-03 remain incomplete.

## BUILD-03 Step 4c — quota and retry coordinator — 2026-11-15

Owner explicitly approved this part. Added a server-only session-derived mutation wrapper, canonical bounded JSON/SHA-256 fingerprints, owner mutation serialization, active-account rechecks, 24-hour owner/operation/UUID receipts and mandatory resource lifecycle authorization on replay. Counter reservations lock global then account rows in stable order; count/byte growth, mutation-rate caps, safe arithmetic and underflow checks share the feature/receipt transaction. Releases and matching receipt replays do not double-charge/decrement. Receipt results are whitelisted metadata only. Trusted feature handlers must still provide validated/scoped writes and accurate deltas; no feature action or content UI is exposed.

Added initial account limits from the feature proposals and explicit required global-capacity variables in `.env.example`, without setting environment values or guessing public capacity. Added three passing pure rule tests and `npm run db:check-mutations` for the owner. That manual script rolls back storage/receipt cases, then temporarily commits synthetic identities and isolated future-minute counters for independent-connection rate/receipt races, with cleanup in finally and absence assertions. No real account content is read. The agent did not execute database tests.

Validation: three pure tests, TypeScript, lint (no warnings), production build, script syntax, relative links and Git whitespace pass. Removed only byte-identical duplicate files in ignored `.next/types` that caused a generated-type collision. Existing unrelated work and machine-local configuration remain preserved. No new schema/migration, package installation, provisioning, database operation, commit or push performed.

Smallest next milestone: owner runs `npm run db:check-mutations` and supplies the final cleanup/success output. Preserve the printed run ID on failure/interruption. Then request approval for final BUILD-03 acceptance work; concurrent storage-specific races, account-block/write races, uncertain commit/connection failures, target-host behavior, role separation and public action checks remain open. Global capacities and receipt/rate-row physical cleanup are unresolved public-release gates; reads and current identity access still work without the new limit variables. Step 4c runtime acceptance and BUILD-03 are not yet complete. See [quota/retry review and manual check](docs/03-technical/build-03-mutations.md).

## BUILD-03 Step 4c — owner runtime verification passed — 2026-11-15

Owner supplied all seven PASS lines, committed-fixture cleanup and final success for run `0e5745cd-97cc-4a44-ad23-0c4801428af2`. The manual script verified replay/payload/expiry/Trash behavior, rollback and underflow, one-time release and blocked replay, concurrent duplicate requests, account/global rate caps and receipt isolation across owners. Synthetic fixtures were removed. This completes the requested manual checks for the current Step 4c checkpoint, not every BUILD-03/public-release gate.

Owner requested a near-term commit checkpoint with limited remaining usage. Documentation/results and final diff are prepared for review; commit/push require explicit checkpoint authorization. No further feature work is needed before committing current progress. Preserve `.neon` and all secrets outside the commit. Next implementation milestone, after owner approval, remains final BUILD-03 acceptance and unresolved operational limits/cleanup; do not silently start BUILD-04. No commit or push performed while recording these results.

## BUILD-03 Git checkpoint authorization — 2026-11-15

Owner explicitly authorized committing and pushing the current BUILD-03 checkpoint and requested Codex co-authorship on every commit. Use `Co-authored-by: Codex <noreply@openai.com>` for this and subsequent session commits. Package only the reviewed source, migration, check scripts, example configuration and documentation. Keep `.neon`, local environment/certificate files and secrets untracked. Prior passing automated checks and the owner's successful manual checks are recorded above. Commit/push success must be confirmed from Git, not inferred from this authorization entry. No new feature or final acceptance work is authorized by the Git checkpoint.

## BUILD-03 — final database acceptance prepared — 2026-11-15

Owner authorized task 1: final database acceptance for storage races, account-block/write ordering and connection failures. Added `npm run db:check-acceptance` with four account/global count/byte races, both observed lifecycle lock orderings, simulated lost-response/precommit retry reconciliation, and an own-session idle disconnect followed by rollback verification and retry. The script temporarily commits only synthetic identities/content and exclusively reserved future accounting windows, with finally cleanup and absence assertions. An internal storage-window override isolates these tests from live lifetime counters; the server-only mutation wrapper never supplies it. No real account content is queried. See [acceptance instructions and evidence boundaries](docs/03-technical/build-03-acceptance.md).

Extracted the existing connection connect/work/finally-close lifecycle into an internal helper and added four deterministic tests for failure propagation, no automatic retry and acknowledged-success preservation on close failure. These injected tests are not driver/socket fault evidence. Production accounting, configured timeouts and public entry points retain their prior behavior. No feature UI, migration, package installation, environment change, provisioning or database operation performed by the agent.

At preparation, validation included production build, TypeScript, lint, all seven then-existing local tests, script syntax, relative documentation links and Git whitespace checks. Live acceptance was pending at that checkpoint; the completed run is recorded below. Socket loss exactly during COMMIT, target-host behavior, role separation, global capacities, physical metadata cleanup and public-action/session UI checks remain explicit unresolved gates; BUILD-04 had not started.

Git inspection confirmed checkpoint commit `05a4519` with requested Codex co-authorship and a branch matching its local remote-tracking reference; no network push verification was performed this turn. Existing machine-local `.neon` remains untouched and untracked. No new commit or push performed.

Preparation checkpoint: owner-run acceptance output and investigation of failures were pending. That checkpoint is superseded by the completed run recorded below.

## BUILD-03 — final database acceptance passed — 2026-11-15

The first live attempt, run `5dacfc74-4c81-4eb3-aebc-7035d73539dd`, failed during fixture setup and reported connection cleanup failure. A read-only, run-scoped lookup found no fixture identities; setup inserts identities and reserved ledger rows in one transaction, so no committed fixture cleanup was needed. The first run's underlying transport error was hidden by the acceptance script. Added redacted error-chain reporting for future failures.

Reran acceptance as `69cac6ef-2d2d-4801-ade9-b2163e16cf27`. All eight checks passed: concurrent account/global count and byte reservations, both account-block/write orderings, retry reconciliation, and own-session disconnect rollback/retry. Synthetic fixture cleanup and final success both passed. The connection error log was expected from the deliberate idle-session termination. The informational module reparse warning remains. All six deterministic connection lifecycle tests also pass.

BUILD-03 final acceptance is complete for the tested development database. Actual socket loss exactly during COMMIT and target-host runtime remain unverified. Global capacity limits, receipt/rate-counter physical cleanup and database role separation remain operational gates; blocked-session UI and future public-action authorization also remain open. BUILD-04 has not started.

## BUILD-03 — operational gates documented — 2026-11-15

Added [BUILD-03 operational gates](docs/07-deployment/build-03-operational-gates.md), verified against current official Neon/PostgreSQL documentation. Recorded the current seven required global application caps and their fail-closed behavior; distinguished app counters from provider compute/storage/transfer limits. Documented bounded receipt/rate-counter cleanup under the approved seven-day operational metadata ceiling, including preservation of lifetime counters. Specified a Proposed least-privilege runtime/migration role split, noting that current URL variables do not prove distinct database privileges. Added open-question and release-readiness links. No environment values, schedule, roles, services, or cleanup mechanism were configured.

Unresolved: owner/operator must choose the pilot global caps and exhaustion behavior; cleanup executor/cadence/batch/alerts remain Proposed; database grants and migration compatibility require environment validation. Actual socket loss during COMMIT and target-host runtime remain unverified.

The owner requested a step-by-step feature plan and asked to implement one step at a time, with a summary after each implemented feature. Added [BUILD-04 step plan](docs/03-technical/build-04-step-plan.md) covering private note create/list/read, safe editor/preview, serialized autosave/conflicts, collections/tags, and acceptance handoff. Implemented BUILD-04.1: owner-scoped note listing and read, and explicit idempotent blank-note creation with a no-write-on-GET starter route. The index/read UI shows loading/error/empty content states and raw Markdown source as text; editing is deferred to BUILD-04.2. No application tests or runtime database check were run for BUILD-04.1 in this step. Operational limits, cleanup execution, and role grants remain Proposed. No commit or push performed.

Smallest next milestone: verify BUILD-04.1 if requested, then implement BUILD-04.2 — editor and safe Markdown preview — as a separate step. Global capacity values remain unset, so live mutation acceptance requires a later explicit capacity decision.

## BUILD-04 Step 2 — note editor and safe Markdown preview — 2026-11-15

Owner authorized proceeding one feature step at a time and requested a summary after each step. Implemented BUILD-04.2 on the private note read page: controlled title/body fields, client-side title code-point and body UTF-8 byte feedback, NUL/size validation messages, desktop live preview, mobile Edit/Preview controls, and focus mode with an exit action. Added `react-markdown` 10.1.0. The renderer skips raw HTML, allows only HTTP(S), mailto and relative safe links, opens external web links with `noopener noreferrer`, and displays image alt text without fetching remote images. CommonMark only; no GFM plugin. See [BUILD-04 step plan](docs/03-technical/build-04-step-plan.md).

This step edits only local component state: changes are explicitly labeled unsaved and will be discarded on refresh/navigation. Persistence, autosave, and conflicts are deferred to BUILD-04.3. No tests, typecheck, browser/runtime checks, or database checks were run in this step. `git diff --check` passed. Dependency installation succeeded with an existing peer-dependency resolution warning in the auth dependency tree; unrelated audit findings were not changed. Existing `.neon` and unrelated in-progress BUILD-03 files remain untouched; no commit or push performed.

Smallest next milestone: pause for owner review of this step; then proceed to BUILD-04.3 only when directed. BUILD-04.1 acceptance remains unverified, global capacity values remain unset, and operational cleanup/role grants remain Proposed.

## BUILD-04 Step 3 — serialized autosave and revision conflicts — 2026-11-15

Owner asked to continue with the next feature step and specified that each feature must use a new branch. Created local branch `codex/build-04-3-autosave` from commit `3e603c4` before changing feature files; the prior machine-local `.neon` remains untracked. Implemented a one-second debounce and a single in-flight save per editor. Saves use client UUID mutation IDs, retry the same payload/ID after uncertain errors, and send any newer edits only after the acknowledged revision advances. A before-unload warning remains active while changes need attention.

Added an owner-scoped save service inside the existing private mutation transaction. It locks the active note row, compares the expected revision, validates/normalizes title and body, computes the UTF-8 byte delta, and atomically writes body/title/revision/timestamp with quota accounting and the receipt. Conflicts return only the latest authorized note. The editor preserves local text and offers “Use server version” with discard confirmation or “Save my version” with overwrite confirmation against the latest revision. Expired retry receipts are reconciled by presenting the latest authorized version for an explicit choice.

No tests, typecheck, build, browser/runtime checks, or database checks were run in this step. This is implementation status, not acceptance evidence. See [BUILD-04 step plan](docs/03-technical/build-04-step-plan.md). Global caps, physical receipt/rate cleanup, role separation, and target-host behavior remain unresolved operational gates.

Smallest next milestone: pause for owner review; then proceed to BUILD-04.4 (collections and tags) only when directed. No commit or push performed.

## BUILD-03 — follow-up acceptance attempt and recovery failure — 2026-11-15

At the owner's request, reran `npm run db:check-acceptance`. Run `8eee10f2-b295-4f47-a6d2-3ad370ee5733` failed during fixture setup with an empty-message `ErrorEvent`; transaction connection cleanup also failed. The script reported no success or fixture-cleanup confirmation. Ran the documented scoped recovery command for this exact run ID; it also failed with a database transaction connection cleanup error and did not report successful cleanup. The run ID is preserved for investigation. No database reset, migration, privilege change, or further acceptance retry was performed. Do not claim this run's fixtures were absent or removed; investigate database connectivity and perform a scoped fixture review before another acceptance run.

## BUILD-04 Step 4 — collections, tags, and note associations — 2026-11-15

Owner said to continue and specified that each feature use a new branch. Verified prior branch `codex/build-04-3-autosave` at `784968c` and created `codex/build-04-4-collections-tags` before feature edits; `.neon` remains untouched and untracked. Added owner-scoped collection/tag listing and locking, note tag reads, inline management to create/rename/delete collections and tags, normalized-name limits/duplicate handling, collection selection and a 20-tag note limit. Organization mutations use the existing transactional quota/receipt coordinator. Note autosave now includes collection/tag assignments in its revision/fingerprint; the server validates owner-matched associations and updates note content and associations atomically. Deleting a collection unassigns notes and references; deleting a tag removes note/reference associations; affected notes receive one revision/timestamp bump in the same transaction. The current editor gets the revision from a direct delete when its note was affected; unrelated stale tabs will conflict. Conflict data includes the latest authorized organization choices, and “Save my version” explicitly removes locally selected organizations that were deleted elsewhere.

No tests, typecheck, build, browser/runtime checks, or database checks were run for BUILD-04.4. This is implementation status, not acceptance evidence. `git diff --check` and relative documentation-link checks passed. Global limits remain unset; live mutations therefore remain fail-closed. BUILD-04.1 through BUILD-04.4 still require the planned acceptance handoff. See [BUILD-04 step plan](docs/03-technical/build-04-step-plan.md).

Smallest next milestone: in the development environment, set the required global mutation limits, then exercise signed-in note create/read/edit/autosave/conflict and collection/tag flows with synthetic data and confirmed cleanup. Keep target-host, accessibility, hostile-Markdown, global-cap exhaustion, and deployment acceptance explicitly open unless tested.

## BUILD-04 Step 5 — acceptance handoff — 2026-11-15

Owner approved proceeding with the final planned BUILD-04 step and instructed that BUILD-03 should be ignored for this work. Reviewed the current BUILD-04 implementation and acceptance matrix without performing further BUILD-03 database operations. Fixed issues exposed during verification: Node's direct mutation-rule test runner now resolves the shared tag limit by relative path; autosave state avoids render-time ref reads and handles the conflict result as a discriminated payload; the note page constructs JSX outside its data-fetch catch; and the acceptance script's error-chain type guard now typechecks without changing its runtime behavior.

Verification passed: `npm run typecheck`, `npm run lint`, `npm run test:mutation-rules` (3 passed), `npm run test:connection-lifecycle` (6 passed), and `npm run build`. A temporary production server on loopback returned 200 for `/`; signed-out `/notes` and `/notes/new` redirected to `/auth/sign-in`. The server was stopped after the checks. `git diff --check` and documentation relative-link checks passed.

## BUILD-04 signed-in local acceptance — 2026-11-15

Owner approved temporary development-only mutation caps and requested production guidance. Configured the seven local values in ignored `.env.local`; these do not approve production capacities. Signed in to the local development app and verified blank-note creation, editing, autosave, persisted reload in a second tab, safe Markdown rendering of a hostile HTML fragment, stale-revision conflict presentation with the local draft preserved, and both explicit resolution choices. Created a collection and tag, assigned them to the note, then deleted both; the note remained and its associations were cleared. Removed the exact synthetic note in a transaction that decremented the matching account/global lifetime note counters. Receipt metadata and minute-rate counters were retained for normal expiry. The notes empty state and new-note page had stale “next step” copy; corrected both to describe the implemented editor.

Verified two-account isolation using separate Google identities in separate browser sessions: each account's notes list excluded the other's synthetic title/body, and direct note routes returned the generic unavailable response. Removed both exact synthetic notes and atomically reconciled account/global note counters. A local global note-count cap of zero rejected note creation without creating a row. At 320, 375, 768, and 1024 CSS pixels, the editor had no horizontal overflow; mobile Edit/Preview controls remained 44px high and the selected panel displayed. Keyboard traversal at 320px reached labeled title, Markdown and collection controls with visible focus. The DOM accessibility check confirmed names for editor controls, valid mobile `aria-controls` targets, and a polite save-status region. A spoken screen-reader session remains unverified. The app's notes delete/trash workflow is outside BUILD-04 scope; all synthetic notes have been removed with guarded transactions and accounting reconciled. `.neon` remains untracked and untouched.

Local checks after the copy change passed: `npm run typecheck`, `npm run lint`, `npm run test:mutation-rules` (3 passed), `npm run test:connection-lifecycle` (6 passed), and `npm run build`.

Reran the local validation suite; typecheck, lint, both test suites, and production build passed. A quota/receipt database run `5063856e-5665-4ec7-a814-f416610c3993` failed before fixture setup committed. A scoped elevated read-only review found zero matching synthetic identities and zero reserved global rows; no cleanup was needed for that failed attempt.

Shared database acceptance then passed as run `fb6f8f83-4711-4c9d-a003-f88c15d6fbf3`: concurrent account/global note-count and note-byte reservations, both account-block/write orderings, retry reconciliation after a discarded success response and after a rolled-back failure, and own-session disconnect rollback followed by a fresh retry. Synthetic fixture cleanup and final success were confirmed. In a separate authenticated local feature flow, zero global note-byte capacity caused the expected save error while retaining the full draft; restoring the exact prior local limit and editing the draft saved it. The exact synthetic note was removed and account/global note count and byte totals were reconciled atomically. Retry receipts and minute-rate rows remain for normal expiry.

Smallest next milestone: owner selects the next prioritized MVP feature. BUILD-04 local MVP acceptance is complete. Spoken screen-reader and target-host checks are deferred until after the rest of the MVP; no staging deployment is configured. Keep production capacity values and other operational gates Proposed until workload, provider budget, and owner decisions are recorded.

## README status update — 2026-11-15

Replaced the initialization-era README with current product capabilities, BUILD-04 acceptance status, local setup guidance, validation commands, and links to project documents. It distinguishes local-only mutation caps from unresolved production limits and warns that target-host and remaining acceptance checks are still open.


## BUILD-05.1 — logical Trash and restore — 2026-11-17

Owner authorized starting BUILD-05, one feature at a time, with implementation using 6.1 Sol Medium and testing deferred until a model switch. Created branch `codex/build-05-1-trash-restore`. Added owner-scoped, revision-checked Trash/restore mutations using existing account locks, receipt/rate coordination and lifecycle columns. Trash timestamps use a database-derived UTC clock and a 168-hour deadline; restore checks the deadline in the update statement. Neither transition changes note storage/count usage. Existing active-note predicates block stale saves to trashed notes.

Added a confirmed Move to Trash action for fully saved notes and a private Trash page with 50-item cursor pagination, empty/error/expired states and restore controls. Unknown mutation outcomes retain the same request ID for retry; editor fields lock during pending/uncertain deletion. Trash receipt replay acknowledges prior success without repeating deletion; restore replay rechecks active-note access.

No tests, typecheck, lint, build, browser/runtime or database checks were run. Implementation is not acceptance evidence. See [BUILD-05 step plan](docs/03-technical/build-05-step-plan.md) for pending acceptance cases. No packages, migrations, services, commit or push created. Existing untracked `.neon` remains untouched.

Smallest next milestone: switch to the owner's testing model and verify BUILD-05.1 before the next feature. Physical purge, atomic quota release, restore/purge race evidence and the bounded maintenance trigger remain pending under BUILD-05.2. Trigger/environment decisions remain Proposed; no production cleanup or recovery guarantee is claimed.


## BUILD-05 connection failure resolved — 2026-11-17

Owner authorized `.env.local` development-database testing and asked to fix the failed connection. A minimal read-only `SELECT 1` through the actual `runTransaction` transport reproduced the empty `ErrorEvent` in the restricted sandbox. The identical probe succeeded with approved network access (`require_escalated`). This establishes execution-environment networking as the cause of this failure; no driver, database credential, schema or service change was necessary.

A scoped read-only review of failed acceptance run `c61e3446-40c1-4636-9c72-516cd39b00bf` found zero identities under its exact synthetic issuer and zero global accounting rows in its eight reserved windows (`2250-01-15T20:52:00Z` through `20:59:00Z`). Setup inserts these atomically; no committed fixtures remained and no cleanup mutation was needed. Earlier uncertain-cleanup reports for this exact run are superseded by this evidence.

Neon MCP explicitly returned project-not-found for the project ID in `.neon`; that connector's project access remains unresolved, independently of the working local database connection. Secrets must never be printed while diagnosing connections. No credential reset, provisioning, commit or push occurred.

BUILD-05.1 and the internal BUILD-05.2 purge primitive pass previously run typecheck, lint and production build. Review corrected purge's owner advisory lock to precede quota locks. This is static/review evidence only; Trash/restore/purge runtime acceptance has not run. A daily maintenance invocation and alert thresholds are recommendations, still Proposed, with no trigger deployed.

Smallest next milestone: switch to the owner-selected Luna Low testing model and run targeted BUILD-05 lifecycle/purge acceptance with approved network access and exact synthetic fixture cleanup. The general acceptance script is not a substitute for BUILD-05-specific coverage. Use the current branch `codex/build-05-2-purge`; changes remain uncommitted and `.neon` remains untouched.


## Isolated development database created — 2026-11-17

Owner explicitly authorized creating a development database. Neon MCP organization discovery found the personal Free organization; created project `cosmiccore-dev` (`lingering-fire-94844546`), branch `development`, database `cosmiccore_dev`, Singapore region, PostgreSQL 18, fixed 0.25 CU. This is an empty isolated project, not a clone of the inaccessible original project. No existing app environment or `.neon` setting was replaced. Application schema migrations, separate test-only credential configuration and targeted acceptance still remain before BUILD-05 testing. Preserve the original environment and never run the global purge acceptance against it.


## Isolated acceptance environment prepared — 2026-11-17

Applied the two existing Drizzle migrations to `cosmiccore_dev` in project `lingering-fire-94844546`, branch `br-steep-math-aznaz6tc`. The separate credential is stored in ignored `.env.acceptance.local` with mode 600; `.env.local` and `.neon` are unchanged. No managed auth is configured in the isolated project.

Corrected the unexecuted purge acceptance harness: all three fixtures reserve 3 notes and 28 UTF-8 bytes; the remaining recent note uses 6 bytes. The harness loads only the isolated configuration, pins its endpoint/database/project, refuses a populated database, verifies accounting before cleanup and verifies synthetic owner/note/counter absence afterward. Extracted the existing purge algorithm into a shared internal core used by both production wrapper and harness, avoiding Next.js server-only imports in Node. No acceptance test was executed this turn. Next: switch to Luna Low and run `npm run db:check-build-05` with approved network access. This harness covers purge batches/idempotency and retained recent Trash; full lifecycle/isolation/deadline/race coverage remains outstanding.


## BUILD-05 bounded purge acceptance — 2026-11-17

Ran `npm run db:check-build-05` against the isolated Neon `cosmiccore_dev` database with approved network access. Run `82f3eb94-e5d0-48c0-a0d4-bdfb79ffdae6` passed: two expired notes were removed over batch sizes 1 then 10; the recent trashed note remained; repeat purge returned zero and no backlog. Synthetic owner, notes and account usage were removed; post-cleanup absence was verified. The harness pins the isolated database and refuses any preexisting users, notes or global usage rows.

After adding the harness/core extraction, first typecheck found a stale generated `.next` route-types duplicate. Removing only generated `.next` output and rerunning resolved it. Typecheck, lint, production build and `git diff --check` then passed. BUILD-05.1 interactive lifecycle, expiry boundary, cross-account isolation, save/Trash race and concurrent restore/purge acceptance remain untested. Maintenance trigger recommendation is still Proposed and not deployed. No commits or pushes.

## BUILD-05 sign-in and acceptance handoff — 2026-11-18

The owner reported that sign-in appeared to work after the app began sending absolute, same-origin OAuth callback URLs. Typecheck passed for that change. The dev server was launched with the isolated acceptance database URL explicitly mapped to the app's runtime database variables. The browser result is owner-reported.

Corrected the pending two-owner acceptance harness to check that the foreign active note is readable by its owner, hidden from the first owner, and survives purge. Adjusted fixture counters to match stored bytes. The expanded harness has not run and still requires an empty target. Next, verify interactive Trash and restore with disposable notes on the current dev database. Run the database-wide purge harness on a separate empty target or after confirming the isolated target is empty. The maintenance trigger remains Proposed.

## BUILD-05 verification complete — 2026-11-18

Safari smoke verification passed for create/save, canceling Trash confirmation, moving a note to Trash, and restoring it. Expanded synthetic acceptance run `ac74f344-2d54-4315-bb23-cf8fb2ad9a66` passed on the isolated Neon `cosmiccore_dev` branch. It covered bounded/idempotent purge, retention of recent Trash, quota release, two-owner privacy and foreign mutation denial, tied cursor pagination, invalid cursors, Trash receipt replay, stale revision denial, expired restore denial, restored content/collection, concurrent save/Trash serialization, and concurrent restore/purge. The harness uses production purge/ownership/mutation cores with synthetic lifecycle/save handlers; authenticated Server Action wrappers and all accessibility/error UI states remain unverified. `npm run typecheck`, `npm run lint`, `npm run test:mutation-rules`, and `npm run build` passed. Final app tables are empty (`app_users`, notes and quota ledgers); three Neon Auth identities remain. No trigger, commit, push or PR was created.

Smallest next milestone: review BUILD-05 PR #3; keep the maintenance-trigger choices Proposed and outside deployed scope.

## BUILD-05 PR opened — 2026-11-18

Committed the reviewed BUILD-05 changes as `54b8e70` with `Co-authored-by: Codex <codex@openai.com>`, pushed `codex/build-05-2-purge` to `origin`, and opened [PR #3](https://github.com/rhobrenz665/cosmiccore/pull/3) against `main`. The unrelated untracked `.neon` file remains unstaged and unchanged. No merge or deployment was performed.

## Interactive Visual Lab future design — 2026-11-18

Recorded the approved viewer-first design direction in the [future feature proposal](docs/04-features/interactive-visual-lab/spec.md) and linked it from both backlogs and the design system. The proposal covers local playback, prediction, accessible mobile and desktop layouts, private authoring and later bounded AI assistance. Example selection, performance limits, renderer dependencies, deletion/history and source-derived retention remain Proposed.

Smallest next milestone remains BUILD-06.1 reference contract review. Visual Lab is outside MVP and follows the already prioritized mock-interview milestone. Implementation has not started.

## BUILD-07 implementation and local verification — 2026-11-20

Created `codex/build-07-knowledge-dashboard` from current `origin/main` after confirming the [BUILD-06 merge](https://github.com/rhobrenz665/cosmiccore/pull/5).

Knowledge now browses and searches owned active notes and references together, with type, collection, all-selected-tag filters, list/grid views, and bounded keyset pagination. Relevance uses weighted PostgreSQL `simple` full-text search with length normalization. Results show escaped excerpts, organization, and internal detail links. An external reference link is available only for a validated saved address. List is the initial view.

Dashboard now loads up to five active notes and five references independently using transaction savepoints. It reuses existing capture actions, links to the most recent available item, and distinguishes empty regions from failed queries. Chat displays its pending state and makes no provider requests. Markdown import remains BUILD-08.

Typecheck, lint, all nine existing tests, and production build passed. The signed-out local server returned 307 to sign-in for Dashboard, Knowledge, and filtered Knowledge. The server was stopped. A read-only transaction on the pinned isolated development database ran the production mixed-search SQL against in-query synthetic rows. It verified complete pagination over 25 tied records with microsecond timestamps, relevance pagination, type/collection/two-tag matching, organization projection, exclusion of trashed and foreign records, and rejection of foreign or mismatched cursors. It wrote no fixtures.

Smallest next milestone: complete signed-in BUILD-06 and BUILD-07 acceptance in the confirmed development environment, including mixed search through the normal UI, dashboard failure and capture behavior, two-account navigation, mobile and keyboard use, and performance with representative account sizes. No schema changes, provisioning, commits, pushes, or deployments were made for BUILD-07.

## BUILD-08 Markdown transfer implementation — 2026-11-21

Created `codex/build-08-markdown-transfer` from `origin/main` after confirming the [BUILD-07 merge](https://github.com/rhobrenz665/cosmiccore/pull/6). Added a private single-file import with escaped UTF-8 preview, an idempotent quota-accounted write, individual last-saved Markdown export, and bounded active-note ZIP export from a single database statement snapshot. The ZIP uses uncompressed entries with sanitized title/UUID filenames and no new dependencies. Bulk export uses a configurable five-per-account default over a one-hour window. The generated rate-limit migration is [0002_note_export_usage.sql](drizzle/0002_note_export_usage.sql).

Typecheck, lint, production build, and all nine existing tests passed. A timing-sensitive connection test passed on rerun. A duplicate generated Next.js route type was removed before the final successful typecheck. Direct transfer checks covered invalid UTF-8, binary controls, unsupported extension, oversized input, empty documents, BOM/Unicode/CRLF byte fidelity, stream cancellation, and standard ZIP extraction and checksums. The signed-out loopback smoke check passed for the import-page redirect, private JSON errors, same-origin and cross-origin handling, oversized chunked input, and bulk HEAD. The origin check now uses the browser-facing HTTP Host. The temporary server was stopped.

Smallest next milestone: apply the reviewed migration to the confirmed development database and run signed-in round-trip, two-account and Trash isolation, mutation replay and quota, concurrent bulk rate-limit, and browser round-trip/download checks. Target-host origin handling, export deadlines, and memory/concurrency performance remain unverified. No database operations, package installation, commits, pushes, or deployments were performed.

## Local sign-in diagnostic — 2026-11-21

The running port 3000 server uses HTTP and the original `neondb` pairing from `.env.local`. Both that database and the separately pinned `cosmiccore_dev` database answered read-only probes. Neither has the BUILD-08 bulk export rate-limit migration. The Google sign-in initiation payload from `http://localhost:3000` reached Google's account selection. The equivalent `http://127.0.0.1:3000` call returned `INVALID_CALLBACKURL`. The Google account selection and return callback still need an interactive check. No configuration or database changes were made.

## HTTPS sign-in and reference dialog follow-up

The owner confirmed Google sign-in completes on the local HTTPS server. The server still uses the original `neondb` configuration. Updated the shared reference capture/edit form so its desktop positioning overrides the bottom sheet's side-specific styles, while retaining the mobile bottom sheet. Next, verify desktop centering and narrow-screen behavior in a signed-in browser. BUILD-08 still needs the rate-limit migration and transfer acceptance on the isolated development database.

## BUILD-08 isolated development acceptance — 2026-11-21

Applied the approved migration only to pinned `cosmiccore_dev` and verified its third migration and export rate-limit table. Restarted the HTTPS server with process-only database overrides for that target. Google auth uses the existing Neon Auth endpoint. Environment files were preserved.

In signed-in Safari, verified the centered desktop Add reference dialog and its bottom sheet at 390 × 844. Imported a disposable Markdown file with a preview. Compared the source, isolated database bytes, individual Safari download and checked ZIP contents byte for byte. Fixed the browser download completion check to use an explicit export byte-count header independent of how the HTTP response is framed. Typecheck and lint passed. Moved the disposable note to recoverable Trash. The next ZIP was empty and its direct individual export returned NOT_FOUND.

Remaining acceptance covers a second signed-in account, import retry replay, concurrent rate-limit enforcement, and target-host performance. The isolated HTTPS dev server is still running.

## Isolated development launcher

Added and started `npm run dev:isolated` as the repeatable HTTPS launch command for the pinned `cosmiccore_dev` branch. It reads the ignored acceptance configuration, sets both database URLs for the server process, and retains the existing Google sign-in pairing. Setup is documented in [README](README.md).

## BUILD-08 handler acceptance with synthetic accounts

Ran the actual import and export route handlers against pinned `cosmiccore_dev` with a test substitute at the Google identity boundary. Repeating an identical import with the same mutation ID returned the original note and kept one row. Reusing the ID with changed bytes returned 400. The other account received 404 for the individual export and an empty ZIP for its own bulk export. Four overlapping bulk requests at a test cap of two returned two successes and two 429s. Removed both synthetic accounts, their notes and counters, and reconciled their global quota deltas. The earlier Safari round trip covers real Google sign-in for one account. A second Google session and representative target-host performance remain unverified.

## BUILD-09 implementation and verification — 2026-11-21

Created `codex/build-09-settings-account` from current `main` after BUILD-08 merged. Settings shows a read-only Google profile, revision-checked account appearance controls shared with the header, Markdown transfer and Trash actions, AI availability, and sign-out with an unsaved-note prompt. Generated the preferences and account-deletion migration. Deletion uses a short-lived account-bound intent, a new verified Google session and typed confirmation, followed by an atomic access block and one cleanup job. An operator command processes quota-aware cleanup, verifies the configured Neon Auth target, retries provider errors, and expires completed deny records after seven days. The isolated launcher explicitly disables deletion because its Auth and app database environments are split.

Typecheck, lint, all nine existing tests, and production build passed. A rollback-only check using the generated migration and real deletion code on pinned `cosmiccore_dev` verified same-session, stale-session, wrong-token and foreign-account rejection, confirmation replay, access blocking, simulated provider outage and retry, app content removal, and completed-record expiry. Confirmed rollback removed the test schema and fixtures. No provider account was deleted and no migration was permanently applied.

Smallest next milestone: apply the reviewed migration to a development environment, verify signed-in preference persistence, and complete the Google confirmation and provider deletion run with a disposable identity on a paired database/Auth branch. Confirm scheduler execution before enabling deletion. Concurrent save/block, keyboard/mobile UI and target-host acceptance remain open.

## BUILD-09 isolated migration and Auth pairing — 2026-11-21

Applied the fourth Drizzle migration to pinned `cosmiccore_dev` and independently verified the deletion tables and paired Neon Auth schema. Added the explicit `--paired-auth` launcher option and verified that the local Google sign-in request returned the paired Auth initiation URL. Safari automation timed out before signed-in UI acceptance. The cleanup worker now checks that the managed user row is absent after either a successful API response or a replay returning 404. Typecheck, lint, all nine existing tests and the production build passed.

Smallest next milestone: use a disposable Google account on the paired endpoint to check signed-in preference persistence and fresh confirmation. The worker management credential and cleanup scheduler are still missing from the test setup. Verify the live provider deletion and scheduled execution before enabling deletion. No production migration, account deletion, commit or push occurred.

## Cosmic brand wireframe refresh — 2026-11-22

Added a [standalone interactive wireframe](docs/05-design/wireframes/cosmiccore-brand-preview.html) based on the owner's Nebula brand reference. It shows the revised mark, Cosmic and Minimal treatments, light and dark, desktop and mobile layouts, and illustrative scenarios. The refreshed design is Proposed and awaits owner review. BUILD-09 implementation and acceptance status are unchanged.

### Cosmic planet horizon preview — 2026-11-22

Integrated the generated Nebula-inspired illustration into the Cosmic Dashboard and sign-in wireframes. Rendered the Cosmic desktop Dashboard, mobile sign-in and Minimal desktop Dashboard in Chrome. Next design milestone is owner review of the placement and responsive crop before any production UI implementation.

### CosmicCore 2.0 UI audit — 2026-11-22

Installed UI/UX Pro Max outside the project and ran its design-system, shadcn and UX searches. Recorded source and wireframe findings and a [proposed redesign and acceptance plan](docs/05-design/design-system.md#cosmiccore-20-audit-and-redesign-proposal--2026-11-22). The next design milestone is review of the shared shell, Dashboard and sign-in proposal across both appearances before implementation. BUILD-09 signed-in acceptance remains open.

### CosmicCore 2.0 prototype refinement — 2026-11-22

Updated the [interactive design preview](docs/05-design/wireframes/cosmiccore-brand-preview.html) for shell, Dashboard, sign-in and mobile review, with References and Chat availability screens. The next design milestone is owner review of this prototype before any application changes.

### CosmicCore 2.0 appearance implementation — 2026-11-22

Implemented the approved single Cosmic palette and Minimal Light, Dark and System modes with the existing saved preferences. Updated brand and artwork, shell, Dashboard hierarchy, sign-in, Knowledge filter controls, note toolbar and Chat availability. The next milestone is signed-in UI acceptance followed by planning the next Knowledge and editor refinements. BUILD-09 account deletion acceptance remains open.

Verification passed for typecheck, lint, the nine existing tests, and the production build. Signed-out Chrome verified Cosmic, Minimal Light, Minimal Dark, and Minimal System on sign-in at 375 px or 1440 px. Only Cosmic requested the planet asset. Signed-in preference round trips, workspace keyboard flow and contrast measurement remain open.

### UI enhancement workflow agreed — 2026-11-22

Recorded the [three-skill workflow](docs/05-design/design-system.md#ui-enhancement-workflow). Next, gather signed-in UI evidence and prepare the design proposal, component mapping, and production-quality review for owner approval.

### Appearance and Knowledge design review — 2026-11-22

Prepared the [interactive review](docs/05-design/wireframes/cosmiccore-brand-preview.html) and [approval draft](docs/05-design/design-system.md#appearance-and-knowledge-approval-draft) using the installed three-skill workflow. Rendered desktop Cosmic Appearance and mobile-frame Minimal Knowledge in Chrome. Next milestone is owner design approval, then implementation and signed-in acceptance.

### Cosmic reference alignment

Refined the [Cosmic Dashboard preview](docs/05-design/wireframes/cosmiccore-brand-preview.html) using the supplied desktop and mobile references. Rendered both layouts in Chrome. Next milestone is owner review of the Cosmic Dashboard alongside Appearance and Knowledge before further app implementation.

### Immersive Cosmic design review

Refined the [Cosmic prototype](docs/05-design/wireframes/cosmiccore-brand-preview.html) with new orbit artwork, a distinct mobile crop and calmer working surfaces. Captured Chrome previews. The next milestone is owner review of the revised direction before further app implementation.

### Immersive Cosmic implementation

Implemented the approved orbit art, mobile crop, ink surfaces and violet active navigation. Fixed the signed-out image redirect by exempting only the artwork path from the auth proxy. Verified the JPEG returns 200 and the signed-out Dashboard still redirects. Typecheck, lint, nine existing tests, production build and signed-out Chrome theme checks passed. Next is signed-in desktop and mobile acceptance before the next UI improvement pass.

### Immersive Cosmic narrow-screen acceptance

Chrome contrast sampling with production CSS and a representative Dashboard fixture found the 320 px heading at 2.66:1 over the planet rim. Adjusted mobile hero spacing and the dark overlay. The final fixture passed without horizontal overflow at 320, 375, 800 and 1440 px. Minimum sampled contrast was 16.03:1 for the heading and 5.24:1 for the description across those widths. Actual sign-in showed a visible keyboard focus state at 320 and 1440 px. Production build, typecheck and lint passed.

Signed-in workspace acceptance remains open. The paired launcher could not start a second Next.js development instance because this checkout already has a server on port 3000. Next milestone is to use a signed-in session on the paired development environment to verify Dashboard, Settings persistence, and mobile workspace focus.

### Mobile workspace follow-up

Applied the three-skill workflow to the existing mobile shell and More Sheet. More now communicates the active secondary destination, navigation icons are decorative, account feedback wraps below compact header controls, and the sheet can scroll with safe-area padding. Lint, production build, typecheck and diff whitespace checks passed.

Started the reviewed production build at https://localhost:3001 on loopback with the isolated database and paired Auth. Verified Google sign-in initiation with no credentials. This temporary review server avoids the existing dev server on port 3000. Signed-in Dashboard, More Sheet focus return and appearance persistence still require a browser session.

### Safari signed-in Dashboard checkpoint — 2026-11-23

Restarted the loopback review server on port 3001 with isolated paired Auth and account deletion disabled. Safari opened the authenticated Dashboard and showed the workspace navigation, capture controls, and empty Notes and References sections. The session was in Minimal Light. The mobile More focus-return test and saved appearance round trip remain open. No application code changed during this checkpoint.

### Safari appearance persistence checkpoint — 2026-11-23

Observed the signed-in account in Cosmic and verified Cosmic was still selected after reloading Settings. The previous checkpoint observed Minimal Light. Restoring Minimal and checking its stored Light choice, plus closing the mobile More sheet with the keyboard and checking focus return, remain open.

### BUILD-10 source preparation checkpoint — 2026-11-23

Implemented and tested the first local retrieval slice. Source preparation creates deterministic revision-format hashes and bounded heading-aware Markdown chunks with original offsets, Unicode boundaries, fenced-code handling, and explicit byte and chunk limits. Four targeted tests, typecheck and lint passed. The next slice is durable version activation and owner-scoped lexical retrieval. BUILD-09 live deletion acceptance remains open.

### BUILD-10 durable retrieval core — 2026-11-23

Generated the retrieval storage migration and implemented transactional activation of one owned source version at a time, with bounded insert batches and PostgreSQL lexical ranking. The reader joins live source identity and revision, excludes Trash, and caps results at six and two per source. Ownership and cascading deletion are enforced in the schema. Authenticated server-only entry points derive the owner from the current session.

The pinned isolated database passed a rollback-only integration check for foreign access, idempotent indexing, stale revisions, Trash and restore, reference deletion, and account blocking. The migration and fixtures rolled back together. Chunk tests, typecheck and lint passed. Next is indexing invocation/status on normal source screens, distinct retry/failure behavior, and retrieval quality evaluation before calling BUILD-10 complete. BUILD-09 live Auth deletion remains open, and BUILD-11 has not started.

### BUILD-10 source indexing and lexical evaluation — 2026-11-23

Wired Notes and References to authenticated indexing of saved revisions with ready, pending, and retry feedback. Note autosave advances the displayed revision. Ordinary edits and reads stay available if indexing fails. The isolated rollback check verified lifecycle and ownership plus 24 synthetic retrieval cases. Stopword handling and partial term matching improved natural-language questions from 0/6 to 6/6. Exact queries passed 12/12, paraphrases 0/3, and no-match queries 3/3. The 18/21 overall answerable result falls below the proposed 90% target. Next milestone is isolated signed-in source-panel verification and agreement on how to improve paraphrase recall. No migration committed to the database, provider call, or push occurred.

### BUILD-10 Safari acceptance checkpoint — 2026-11-23

Applied migration 0004 to isolated `cosmiccore_dev` and restarted the loopback review server with paired Auth. Signed-in Safari opened the existing test note. The source panel moved from awaiting indexing to indexing to indexed, and still showed indexed after reloading. Reference UI and retry behavior remain unverified in Safari. The 85.7% lexical recall result still falls short of the proposed 90% gate.

### BUILD-10 Safari reference indexing checkpoint — 2026-11-23

Created a labeled synthetic reference in the isolated signed-in Safari workspace and verified the saved version reached indexed status through the normal reference detail panel. The synthetic reference remains available for later checks. Safari failure and retry behavior remains open. BUILD-10 also remains below the proposed recall gate on the synthetic corpus. The current backlog calls for a separate accepted plan before adding embeddings.

### BUILD-10 lexical paraphrase investigation — 2026-11-23

Reproduced the 85.7% baseline and compared English stemming in read-only PostgreSQL over synthetic inputs. It reached 90.5% on the original sample by recovering one inflection, but six unrelated notes pushed that match outside the return limit. No runtime change or AI call. The next step is a fresh held-out evaluation with distractors before deciding whether to trial a hybrid approach. See the [investigation](docs/03-technical/lexical-paraphrase-investigation.md).

### Note-first AI source preview — 2026-11-23

Owner chose to start with questions directly in a note. Implemented a local Ask about this note panel that previews a bounded excerpt from the open note's authorized saved revision. The panel waits for autosave and rejects stale, trashed, missing and foreign sources through the existing note read boundary. The question and result are ephemeral. No hosted model, library retrieval, index preparation or answer generation is used by the preview.

The next smallest milestone is verifying the panel on a signed-in test note and connecting bounded provider-backed answers after the provider and privacy gates are met. Broader retrieval remains a separate enhancement.

Signed-in Safari verified the panel on the existing isolated test note. A sample question displayed the open note as the source and returned its excerpt. Lint, typecheck and production build passed.

### Question-aware note search — 2026-11-24

Ask about this note selects a passage from the authorized saved revision using words in the question and reports when it finds no match. Focused tests cover different questions on the same note and a match late in Unicode text. Knowledge Base search and indexed cross-library retrieval have separate entry points, documented in the [search architecture](docs/03-technical/rag-architecture.md). The next milestone is signed-in verification of both match and no-match behavior. Hosted answers remain gated on provider privacy and usage checks.

Signed-in Safari verified matching and no-match results in the isolated workspace. With a temporary edit to the existing test note, Find passage was disabled during autosave and returned a newly saved passage beyond the first 600 characters after saving. The original test note text was restored and saved. Next milestone is verifying hosted provider privacy and usage limits before enabling generated answers.

Implemented and locally tested the Groq transport for a single note answer. It accepts a bounded question and selected passage, applies a timeout and completion cap, and distinguishes insufficient evidence, provider limits, and unavailable or incomplete responses. The application flow still needs durable quota admission, user disclosure, and a revision recheck before showing an answer. Live testing remains pending verified account access, limits, and data controls.

Verified the GroqCloud model limits in the signed-in console and enabled Inference APIs Zero Data Retention. The editor now supports an opt-in, single-note answer when explicitly enabled on the server. It reserves durable daily usage and checks source freshness before and after generation. Lint, typecheck, and four focused tests passed. Migration 0005, database quota acceptance, and a live synthetic answer with a project API key remain pending in the isolated environment.

Tightened the note-answer instructions for misleading matches, instructions embedded in source text, and partially supported questions. Added a synthetic live check at `scripts/check-note-answer-live.mts`. Four focused tests, lint, production build, and typecheck passed. The live check stopped before making a request because `GROQ_API_KEY` is absent. Release approval for this change is pending live results.

Live synthetic verification initially caught inconsistent weather refusal and an omitted due-date qualification. The answer parser now requires an exact source quote and displays missing details separately. Live Groq passed the instruction, arithmetic, and partial-answer cases, and the current weather fixture was declined locally. Migration 0005 and the quota reservation, cooldown, and daily caps passed in a rolled-back transaction on isolated development. Applying migration 0005 and exercising the enabled editor are follow-up steps for the pilot environment.

### Note AI Safari end-to-end check — 2026-11-24

Restarted the isolated app with note answers enabled after applying migration 0005. Signed-in Safari opt-in sent the synthetic question “Where are the invoices?” with the saved excerpt “The invoices are in the blue folder.” Groq returned “In the blue folder.” and the editor displayed the source excerpt. Restored the original test note and confirmed it saved. API key remains local in ignored `.env.local`. The example configuration defaults the AI feature on for a configured deployment, while runtime still requires a key.

### BUILD-11 chat history foundation

Started from merged main on `codex/build-11-hosted-chat`. Migration 0006 adds private conversations and turns, constrains each turn to a conversation belonging to the same account, and makes submission IDs unique within a conversation. The account cleanup worker removes chat history during live app data removal. Typecheck and lint passed. The migration is generated and awaits isolated database acceptance. The next slice is authenticated history and submission handling, followed by bounded retrieval, citations, and generation.

Applied migration 0006 to isolated development and wired the chat page to save questions, reopen private conversations, and delete their history. The server checks account ownership, submission replay, and per-account storage limits. Typecheck and lint passed. Hosted generation and browser acceptance are pending.

Signed-in Safari verified that a saved chat question persists after reopening the conversation and reloading. The first hosted chat slice adds per-question Groq consent, one passage from current indexed notes or references, the existing shared AI quotas, and a saved answer with a source link that is checked against the current source revision. Migration 0007 is generated. Typecheck and lint passed. The feature flag defaults off. Isolated migration and signed-in generation, multi-source answers, streaming, and cancellation remain pending.

Migration 0007 applied successfully to isolated development. Restarted the paired local server with hosted chat enabled. Signed-in Safari verified that the consent checkbox is required and that a synthetic question without a matching source produces the insufficient-evidence message. Positive note and reference answers, persisted source links, stale-source handling, quota feedback, second-account verification, multi-source answers, streaming, and cancellation remain open.

Chat now sends up to three distinct indexed passages and records only references whose quoted text matches a supplied passage. Links are rechecked against source ownership and revision on reload. Existing single-source answers remain readable. Migration 0008 applied in isolated development. Focused tests covered valid multi-source citations and fabricated quotes. A live synthetic Groq call combined both passages and cited both. Typecheck and lint passed. Signed-in citation and lifecycle verification, second-account checks, streaming, and cancellation remain open.

Added a streamed chat answer endpoint and Stop generation control. The browser receives progress while Groq streams. The final answer appears after citation validation and persistence. Cancellation aborts the upstream request and skips persistence when observed before the write. Nine focused tests passed, including upstream cancellation and an incomplete provider stream. A live synthetic Groq stream returned both citations. Typecheck, lint, and production build passed. Signed-in browser checks for the new route, cancellation, persisted citations, stale sources, quota feedback, and second-account isolation remain open. Durable attempt tracking and context from previous turns remain outstanding.

Added durable tracking for the latest generation attempt on each turn. Concurrent requests from the same account are serialized, expired attempts show as interrupted after reload, and a superseded attempt cannot publish an answer. With consent, up to four bounded earlier questions help interpret the current question. Retrieved passages remain the evidence for the answer. Migration 0009 applied in isolated development. Typecheck, lint, and nine focused tests passed. Signed-in lifecycle, quota feedback, and second-account checks remain pending.

### BUILD-11 signed-in citation acceptance — 2026-11-25

Restored the note indexing control for environments with hosted chat enabled. Safari confirmed it waits for autosave and indexes the latest saved revision. A live Groq answer from a synthetic note displayed a working source link that persisted after reload. Restoring the original note text created a new revision, so the saved answer stayed visible and its citation became unavailable. Typecheck and lint passed. Mixed-source Safari, cancellation and quota feedback, second-account acceptance, and production release checks remain open.

### BUILD-11 provider usage measurement

The chat stream now records Groq-reported prompt and completion counts for the latest attempt. Missing usage stays unknown and does not refund the existing request reservation. A live synthetic streamed answer reported 200 input and 65 output tokens through the implemented parser. Migration 0010 applied in isolated development. Typecheck, lint, and nine focused tests passed. Follow-up browser verification later confirmed 205 input and 67 output tokens persisted with one citation. Partial-output checkpoints and production release checks remain open.

### BUILD-11 Safari and local acceptance update — 2026-11-25

Safari verified a mixed synthetic note/reference answer with both matching source links and reload persistence. A direct synthetic-reference answer with an exact citation also persisted after reload. A rapid follow-up displayed the shared AI usage limit; after the cooldown, another direct query succeeded. One broad wording was initially declined for insufficient evidence, while a direct question succeeded. The remaining signed-in checks and the observed lexical paraphrase gap are recorded below. Partial-output checkpoints and production release checks remain open.

### BUILD-11 remaining signed-in acceptance — 2026-11-25

In Safari, the new `verify punk` test account had empty dashboard, notes, references, and chat history. Direct links to the first account's synthetic conversation, note, and reference returned unavailable states without exposing their content. The original account was signed out when the new account was added, so checks were performed sequentially. A synthetic note and one question remain in the test account for review.

The Stop control was exercised on a streamed answer request. After reload, the question remained, the UI showed “Stopped waiting for the answer,” and a read-only database check reported `attemptStatus=canceled`, no saved answer, and no usage values for the canceled attempt. The separate successful synthetic reference answer persisted one citation with 205 input and 67 output tokens.

Rollback-only database acceptance passed shared quota reservation, cooldown and daily caps. BUILD-10 retrieval acceptance passed its asserted owner isolation, current-revision, Trash/restore, deletion-cascade and rollback cases. Its diagnostic lexical sample scored exact 12/12, question 6/6, no-match 3/3, and paraphrase 0/3; the script does not gate on paraphrase, so this is a search-quality gap to decide rather than a reported script failure. Four focused chat evidence tests, typecheck, lint and the optimized production build passed.

Next smallest milestone: agree whether lexical paraphrases belong in MVP and add an explicit success threshold if they do. Then decide whether partial-output checkpoints are needed and complete production-specific release checks before any deployment.
