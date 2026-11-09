# CosmicCore 2.0

Status: Draft — planning only. Updated: 2026-11-10.

A personal knowledge and learning workspace combining Markdown notes, saved references, search, and source-grounded AI conversations.

The repository initially contained only Git metadata: no commits on `main`, application, dependencies, or design assets. This pass establishes documentation; no implementation, provisioning, installation, commit, or push is authorized.

## Start here

- [Project status and milestones](PROJECT_STATUS.md)
- [Vision](docs/01-product/vision.md), [PRD](docs/01-product/prd.md), [MVP scope](docs/01-product/mvp-scope.md), [backlog](docs/01-product/feature-backlog.md)
- [Architecture](docs/02-architecture/system-architecture.md), [decisions](docs/02-architecture/architecture-decisions.md), [owner questions and risks](docs/02-architecture/open-questions.md)
- [Cost assessment](docs/07-deployment/cost-analysis.md), [design system](docs/05-design/design-system.md)

Selected stack from the brief: Next.js App Router, React, TypeScript, PostgreSQL on Neon, Drizzle ORM/Kit, Tailwind CSS, shadcn/ui, Lucide React. Package versions will be verified when implementation is authorized. Confirmed release constraints: public access, including personal use by the owner and family, a $0 starting monthly budget, and mock interviews after the initial MVP. Separate private accounts and Google sign-in are confirmed. Auth implementation, AI providers, vector strategy, and detailed launch scope remain proposed.

Document statuses: Draft = incomplete working material; Proposed = recommendation awaiting a decision; Approved = explicitly accepted decision; Deferred = intentionally outside current scope. Selected technologies do not imply approval of every integration detail.

## Overall MVP review package

Read the [expanded PRD](docs/01-product/prd.md), [user workflows](docs/01-product/user-workflows.md), [diagram index](docs/02-architecture/diagrams/README.md), [security design](docs/02-architecture/security-architecture.md) and [release gates](docs/07-deployment/release-readiness.md). These are review drafts; detailed feature specifications and wireframes remain to be completed before implementation.

The [first knowledge workflow](docs/04-features/first-workflow/spec.md) and [contracts](docs/04-features/first-workflow/contracts.md) define the next implementation-sized sequence, including validation, API boundaries and acceptance scenarios. Status: Proposed.
