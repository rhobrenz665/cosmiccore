# Foundation implementation proposal

Status: Proposed — PLAN-03 complete as a review draft; BUILD-01 unauthorized | Updated: 2026-11-10

## Intended outcome and boundary

When separately authorized, BUILD-01 produces a runnable Next.js foundation with a shared responsive shell, shadcn/ui primitives and Cosmic/Minimal appearance infrastructure. Its purpose is to make later private knowledge features straightforward to implement and verify. It does not create a working knowledge service or establish public-production readiness.

This document is planning only. No commands below are instructions to execute now. Existing repository documentation and Git history must be preserved. Package installation, scaffold writes, provider setup and application code remain outside the current authorization. No new worktree, commit, push or deployment is implied.

## Scope of the first authorized build

Include App Router/TypeScript configuration, global styles/token layer, local navigation shell, accessible responsive sidebar/mobile navigation, a compact appearance control, minimal route presentation and standard loading/error/not-found treatments. Shared components should come from shadcn/ui where appropriate and use Lucide icons.

Authenticated server guards, Google OAuth, Drizzle schema/migrations, database access, notes editing/persistence, transfers, RAG, model calls, quotas and account cleanup belong to subsequent BUILD tasks. Do not install their SDKs preemptively. BUILD-01 may show clear feature-not-connected states with no private or fabricated production data. Such pages are for local foundation review, not a public authenticated release.

No backup scheduler/storage, local Ollama bridge, interview UI, MCP control, paid tier, sample notification system or decorative bitmap generation. Use CSS decoration/system fonts initially; imagery can follow a separate asset decision.

## Proposed file responsibilities

Paths below describe intended source, not files that already exist.

| Path | Responsibility and rendering boundary |
|---|---|
| package.json + one lockfile | Verified dependency versions and build/check/dev scripts |
| tsconfig.json / next.config.ts / lint config | Strict project configuration; only settings required by chosen stable versions |
| components.json | shadcn generator aliases/style configuration; generation must match the selected Tailwind setup |
| src/app/layout.tsx | Root document, global CSS, narrowly scoped appearance initialization/provider |
| src/app/globals.css | Semantic tokens, theme bindings, base accessibility/reduced-motion rules |
| src/app/page.tsx | Minimal public product entry with real navigation only; no unimplemented feature claims |
| src/app/(workspace)/layout.tsx | Shared shell boundary; initially local UI review only, server auth protection added in BUILD-02 |
| src/app/(workspace)/dashboard/page.tsx | Honest foundation empty/not-connected view; real dashboard query deferred |
| src/app/(workspace)/knowledge/page.tsx | Route shell for subsequent combined-search implementation |
| src/app/(workspace)/notes/page.tsx | Notes list route shell; do not create drafts on GET |
| src/app/(workspace)/references/page.tsx | Reference route shell; no fetching arbitrary URLs |
| src/app/(workspace)/chat/page.tsx | Explain chat not connected; no enabled send/model picker |
| src/app/(workspace)/trash/page.tsx | Route shell; no false restoration actions |
| src/app/(workspace)/settings/page.tsx | Foundation appearance controls only; profile/data/account actions wait for identity/services |
| src/app/not-found.tsx | Safe generic missing view without record details |
| src/app/(workspace)/loading.tsx / error.tsx | Shared loading and recoverable error presentation; error boundary is client-only as required |
| src/components/ui/* | Only the shadcn primitives actually used in this task |
| src/components/layout/* | Shell, desktop navigation, mobile navigation/More, skip link and active destination |
| src/components/appearance/* | Explicit client boundary for appearance/theme interaction |
| src/lib/navigation.ts | Typed route labels/icons shared by desktop/mobile; no domain data |
| src/lib/utils.ts | shadcn class composition utility if required by generated components |
| .env.example | Optional nonsecret variable names only when a foundation setting actually requires them |

Use the project root for planning docs as-is. Do not relocate docs or replace README/AGENTS wholesale with generator defaults. Avoid precreating empty feature/service layers, unused database folders or speculative API routes. When later domain work begins, introduce feature services under src/features and server adapters under src/lib as specified by architecture.

## Dependency selection and validation

Proposed package manager: npm with one package-lock.json, because there is no existing package manager to preserve. This is a recommendation, not an approved version choice. During the authorized build, inspect runtime/tool availability and verify current stable framework/React/TypeScript/Tailwind/shadcn/Lucide compatibility from official documentation and package metadata. Record actual selected versions and reasons in the task report. Use a supported Node LTS compatible with the chosen packages; verify it then rather than pinning an unverified version now.

Scaffold into the existing documentation repository carefully: inventory files first, then choose a supported in-place approach or generate in an isolated temporary directory and move only reviewed scaffold files. Never overwrite existing files blindly. Keep the generated dependency set minimal. No prerelease/RC version solely because a provider example copied it. Inspect scripts/changes introduced by generators and lock versions consistently.

Foundation runtime dependencies should be limited to the selected framework/runtime, Lucide, appearance management if justified, and actual shadcn primitive requirements/class utilities. Choose the current supported shadcn foundation rather than mixing incompatible registry styles or primitive packages. Do not handcraft dialogs/navigation accessibility if a matching maintained primitive fits. Do not introduce a global state store, data-query framework, auth UI suite or AI SDK for static shell work.

## Shared token and appearance contract

Use semantic tokens as the single source of styling. Recommended categories align with shadcn conventions: background/foreground; card/card-foreground; popover/popover-foreground; primary/primary-foreground; secondary/secondary-foreground; muted/muted-foreground; accent/accent-foreground; destructive; border/input/ring; sidebar variants; radius and spacing/elevation. Map them through the chosen supported Tailwind configuration.

Separate appearance (`cosmic|minimal`) from color preference (`light|dark|system`). Use one DOM/component hierarchy, with an appearance attribute and resolved theme class/attribute. Cosmic adds restrained purple/blue decoration to welcome/marketing surfaces; dense editor/search/chat reading surfaces stay quiet. Minimal uses solid neutral surfaces with the same action/selection semantics. Do not clone pages for each mode or hard-code every component's colors.

Exact token values are intentionally not finalized before contrast review. Every normal text pair targets at least 4.5:1; large text at least 3:1. Focus and control state must remain distinguishable without glow/color alone. Reduced-motion behavior is independent of Cosmic selection. Avoid animated backgrounds, layout-affecting theme transitions or decorative network fetches in BUILD-01.

First-visit color preference is approved as System. Initial visual appearance is approved as Cosmic, with Minimal available through settings. Foundation preferences are local preview state, not an implemented per-user persistence service; server-authoritative account preferences arrive with Settings implementation. A pre-render hint contains only enumerated appearance values, never identity/content. Theme state must handle system changes and avoid hydration mismatch/visible flashing through the selected supported approach.

## Navigation and responsive behavior

Desktop navigation: Dashboard, Knowledge, Notes, References, AI Chat; footer Trash and Settings. Mobile bottom destinations: Dashboard, Knowledge, Notes, AI Chat, More; More exposes References, Trash and Settings using an accessible Sheet. All destinations resolve to real foundation routes, even if functionality is clearly not connected. Avoid duplicate hamburger and bottom navigation controlling the same destinations.

Use normal links for route changes and buttons for menu/theme actions. Include a skip-to-content link, main landmark, labeled navigation, active-page state, predictable focus and accessible names for icon-only controls. Navigation must remain usable without hover. Sheets trap/restore focus through the chosen primitive and close safely after navigation. No button nested within a link.

Proposed breakpoints follow the design draft: below 768px single-column/mobile, 768–1023px compact navigation, 1024px and wider sidebar. They are starting layout values, not guarantees for devices. Verify at 320px width, tablet/wide layouts and 200% zoom. Account for mobile safe areas; bottom chrome cannot obscure final content or focused controls. Foundation shell must not require an actual sign-in to review locally, but cannot be advertised/deployed as protected until BUILD-02 guards exist.

## Checks and review evidence

| Check | Evidence required for BUILD-01 completion |
|---|---|
| Documentation preservation | Existing docs and original metadata retained; generated edits inspected |
| Dependency coherence | One lockfile; compatible stable versions recorded; no unused auth/DB/AI packages |
| Static/build | Type checking, linting and production build pass using actual configured scripts |
| Routing | All foundation nav destinations resolve; Back/Forward and active state work; no GET mutation |
| Theme matrix | Cosmic/Minimal × light/dark/system checked; system change and reload behavior recorded |
| Responsive | 320px, tablet, desktop and 200% zoom review with no clipped actions/content |
| Keyboard/accessibility | Skip link, tab/focus states, More sheet, appearance controls and contrast reviewed |
| Error/loading | Safe generic states with no private data or false “saved/connected” indicators |
| Scope/security | No secrets, model calls, database/cloud provisioning or unguarded real private data |

Run meaningful checks once; broaden only when failures/new edits justify it. No elaborate snapshot suite for static chrome alone. Functional end-to-end and database concurrency tests arrive with real feature behavior. Record screenshots/browser checks during the authorized build if tooling is available; this proposal does not claim rendered QA or runtime checks have occurred.

## Completion and handoff

BUILD-01 is complete only when the locally runnable shell and above evidence exist, with deviations and unresolved failures documented. Refresh project status with actual commands/results and selected versions. Do not call the full MVP implemented because the shell looks complete.

Next build task would be BUILD-02 identity mapping after accepting the managed-auth proposal and authorizing necessary setup. If framework compatibility, tooling or repository conditions require a substantial scope change, document it before proceeding. A successful build does not imply permission to provision, deploy, commit or push.

## Decisions remaining for owner review

- Approved first-visit color preference: System. Approved first-visit visual appearance: Cosmic.
- Approved profile: read-only Google-derived identity fields initially.
- Approved re-registration: a fresh empty account only after prior app/provider deletion completes; no old data restoration.

These do not require regenerating the completed feature specs. Technical proposals still needing validation include auth/session freshness, runtime/driver compatibility, transport, search ranking, exact global quotas and cleanup scheduling. Seven-day operational-metadata retention is approved; keep its implementation minimal and separate from deferred backups. No implementation starts until the owner explicitly authorizes it.

## Header theme control refinement

Include the owner-requested light/dark button using the [shared design-system behavior](../05-design/design-system.md). It complements the compact appearance settings without duplicating the full settings panel. Initial color preference remains System; clicking selects an explicit opposite theme. Cosmic/Minimal remains independent; the approved first-visit appearance is Cosmic.
