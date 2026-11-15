# CosmicCore 2.0

CosmicCore is a private knowledge workspace for Markdown notes and learning. It uses Google sign-in and keeps each account's notes and organization private.

## Current status

BUILD-04 implementation is complete: private note creation, listing, reading and editing; Markdown preview; debounced autosave with revision-conflict choices; and collections and tags. Core signed-in local flows have been exercised. BUILD-04 acceptance is still partial: two-account isolation, live quota and retry edge cases, responsive and accessibility checks, and target-host behavior remain unverified. See [project status](PROJECT_STATUS.md) and the [BUILD-04 acceptance plan](docs/03-technical/build-04-step-plan.md).

Production capacity values and launch readiness have not been approved. The seven global mutation limits must be explicitly configured before database-backed mutations are enabled. The sample values in a developer's ignored `.env.local` are for local testing only; do not treat them as production limits or commit that file.

## Technology

- Next.js App Router, React, and TypeScript
- PostgreSQL on Neon with Drizzle ORM
- Neon Auth with Google sign-in
- Tailwind CSS, Base UI, and Lucide React
- `react-markdown` for safe Markdown preview

## Local development

Use Node.js 22 or newer and a development Neon branch. Copy `.env.example` to `.env.local`, fill in the development database and auth settings, and configure all seven `COSMICCORE_GLOBAL_*_LIMIT` variables with non-production values before testing mutations. Follow the [auth integration notes](docs/03-technical/auth-integration-validation.md) for Google sign-in setup. Keep `.env.local` and the machine-local `.neon` project link out of commits.

```sh
npm install
npm run db:migrate
npm run dev
```

For a local HTTPS development server, use `npm run dev:https`.

## Checks

```sh
npm run typecheck
npm run lint
npm run test:mutation-rules
npm run test:connection-lifecycle
npm run build
```

Database acceptance scripts require an explicitly configured development database and may create temporary test fixtures. Read the relevant acceptance plan before running them. Do not run them against production.

## Project documents

- [Project status and next milestone](PROJECT_STATUS.md)
- [Approved MVP scope](docs/01-product/mvp-scope.md)
- [Architecture](docs/02-architecture/system-architecture.md)
- [Build plans and acceptance evidence](docs/03-technical/)
- [Cost assessment](docs/07-deployment/cost-analysis.md)
