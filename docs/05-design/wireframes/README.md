# Proposed screen blueprints

Status: Draft — text wireframe plan based on user references, not rendered UI

## Shared shell

Desktop: left sidebar → header with search, appearance and profile → page content. Sidebar: Dashboard, Knowledge, Notes, References, AI Chat; footer: Trash and Settings. Mobile: compact brand/search/profile header → content → bottom destinations Dashboard / Knowledge / Notes / AI Chat / More. Appearance is a single compact control reachable from header/settings; More exposes References, Trash and Settings. Navigation ordering is Proposed.

Use one layout/component system for all six appearance/color combinations. Do not implement duplicated Cosmic and Minimal page trees. At narrow widths use single-column reading and stacked actions. See [design system](../design-system.md) for breakpoints and accessibility expectations.

## Landing and sign-in

Brand + navigation to real content → concise product value + Google sign-in CTA → honest feature preview → privacy and availability notes → footer. Separate sign-in view: brand, Google action, privacy explanation, loading/cancel/error handling. No paid tiers, fabricated demo, or unsupported interview/MCP marketing claims.

## Dashboard

Compact welcome + New Note / Save Reference → optional small owner-scoped counts → recent notes + recent references → resume recent chat/work when available. AI entry reflects availability; unavailable AI explains why. Omit interview stats and practice panel for initial MVP. First-use screen offers create/import/save reference rather than sample metrics.

## Knowledge and references

Heading + create action → query field + collection/tag/type filters → grid/list toggle → paginated owner-only results. At mobile widths filters move to an accessible sheet and list is the proposed default. Separate References page emphasizes URL, title, description, tags and external-open action; no automatic metadata fetch or favorites implied.

## Notes list and editor

List: heading + New Note / Import → search/filters → notes → export action. Editor: back/breadcrumb → editable title → saving state + overflow actions → collection/tags → Markdown editor and preview → optional outline. Desktop can use split preview; mobile uses Edit/Preview tabs. Focus Mode hides secondary navigation. Overflow contains export and Move to Trash; no Share or AI Assist toolbar in this scope.

Conflict: preserve local text, show server revision, provide explicit resolution and retry. Import: file choice, validation/preview, create confirmation. Bulk export: scope and saved-data notice, bounded download/progress/error. Exact component contracts follow in the feature spec.

## Trash

Heading + 7-day recovery explanation → owner-only list with deletion/expiry time and Restore → expiry/error/empty states. Do not offer restoration after deadline. Permanent-delete-now action is not assumed. Normal search and exports exclude Trash.

## AI chat

Conversation list (mobile drawer) → conversation heading → messages with per-answer source controls → availability/status → composer and send/cancel. Sources open an authorized preview or source record. Use explicit states for disabled provider, quotas, indexing pending, no evidence, interrupted generation and stale/deleted source. No attachment, model picker or executable tools in initial wireframes.

## Settings

Profile and Google account identity → Appearance (Cosmic/Minimal + Light/Dark/System) → data import/export and Trash links → account deletion flow → availability/usage explanation. No Pro plan or MCP connection controls. Account retention details remain unresolved and must be specified before release.

## Next design deliverable

Create reviewable desktop/mobile wireframes for sign-in, dashboard, notes editor/list, search/organization, import/export and Trash, including error states. Then refine chat/reference/settings layouts. User references inform composition; these text blueprints do not replace rendered wireframes or implementation acceptance tests.

## Interactive review draft — 2026-11-10

Created an in-conversation preview covering Google sign-in, dashboard, Markdown editor, knowledge/search, import/export and Trash. Review controls switch desktop/mobile, Cosmic/Minimal and typical/empty/error scenarios. Example content is illustrative. Buttons simulate local navigation/state only; no authentication, persistence, upload, download or production service is connected. The preview is conversation content, not application source.

Outstanding refinements: real conflict-comparison layout, collection/tag selectors, reference entry dialog, mobile More sheet, focus-mode behavior, distinct mobile preview navigation, responsive runtime QA and full accessibility validation. AI chat and settings rendered wireframes remain later design tasks. JavaScript syntax is checked separately; no browser-rendered QA is claimed.

## Owner review — 2026-11-10

Status: Approved as the initial design direction. The owner accepted the current wireframes for now and deferred further visual enhancements to a later update. This approval covers the starting layout/direction, not unfinished interactions, accessibility verification or application implementation. shadcn/ui remains the primary component foundation, with Tailwind CSS, Lucide icons and shared Cosmic/Minimal tokens. Required error/privacy/recovery behavior remains part of feature specifications even when not fully represented in the preview.
