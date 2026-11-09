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

Owner explicitly authorized an initial Git commit and push, superseding the earlier no-commit/no-push restriction for this checkpoint only. Planning work is paused at the owner's request until credits are available again. No application implementation has been authorized.

Resume here: validate managed Neon Better Auth's current Next.js integration, public Google OAuth production configuration and free-tier requirements, then finalize auth/driver recommendations. The first-workflow specification/contracts and accepted initial wireframe direction are ready for review. See the outstanding release gates before implementation or public launch.

Git was already initialized on main with no commits or remote. Initial local checkpoint and remote push status must be confirmed from Git rather than assumed from this handoff entry.
