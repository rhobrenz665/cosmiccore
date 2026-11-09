# Visual reference review

Status: Draft / recommendations Proposed | Reviewed: 2026-11-10

## Direction to retain

The six supplied references establish a recognizable purple identity, a persistent desktop sidebar, search-led header, clear New Note action, recent-work panels and a shared layout across Cosmic/Minimal. Images 5 and 6 are particularly useful as a paired comparison: the information structure can stay stable while decorative treatment changes. Image 2 demonstrates compact appearance settings; images 2 and 4 suggest mobile bottom navigation. Image 3 informs page composition beyond the dashboard.

## Enhancements and scope reconciliation

| Area | Observation | Proposed enhancement / MVP treatment |
|---|---|---|
| Cosmic decoration | Stars, planet heroes, repeated purple borders/glow | Concentrate imagery in landing/dashboard hero; keep editor, search results and chat reading surfaces quiet. Reduce glow on routine controls |
| Minimal appearance | Image 6 retains strong purple accents and subtle geometry | Preserve the accent identity while using solid neutral surfaces and fewer effects; no cosmic background |
| Dashboard density | Large hero, metric cards and practice card occupy substantial space | Shorter hero, New Note primary action, Save Reference secondary action, recent notes/references immediately reachable |
| Appearance controls | Images 4/5 repeat large controls in multiple locations | One compact appearance entry in header, plus the same settings in Settings. Two dimensions: Cosmic/Minimal and Light/Dark/System |
| Mobile navigation | Bottom navigation in images 2/4; image 4 also shows hamburger | Propose Dashboard, Knowledge, Notes, AI Chat, More as bottom destinations; avoid a duplicate main hamburger menu. More contains References, Trash, Settings |
| Notes editor | Image 3 includes formatting controls, Share and AI Assist | Markdown-first editor with preview; formatting inserts Markdown. Remove Share; defer AI rewrite/quiz sidebar pending separate scope |
| Knowledge organization | Feature board uses folder imagery and mentions folders | Flat collection cards and tags only; visual folder icons do not imply nesting |
| Interviews / MCP | Images show active navigation, practice actions and integrations | Deferred; hide active controls or use a clearly labeled informational Coming later entry. No interview metrics in MVP |
| AI provider selector | Image 3 displays Local Ollama | Development-only Ollama remains the proposal; no public model selector or local-device connection implied |
| Uploads / favorites | Attachment and star icons appear in image 3 | Do not introduce file upload or favorites without specification; exclude those controls from initial wireframes |
| Counts and badges | Illustrative totals, Pro badge, notification dots | Use real owner-scoped counts, omit nonexistent plans/notifications. Reference values are not demo data requirements |
| Continue Learning | Reading-time/play affordances suggest courses/progress | Define as Resume recent work, opening notes or chat. No progress tracking or course player implied |
| Landing page | Pricing, demo, integrations and interview claims | Show only available capabilities; Google CTA; no fake pricing/demo destination or unlimited free AI promise |
| Private data | Share controls could imply collaboration | Each user remains private; no sharing controls in MVP |
| Trash | Not shown in supplied references | Add owner-only 7-day Trash with restore action, expiry and empty/error states |

## Recommendation

Recommendation: use the paired desktop layouts as the base shell, the compact appearance control from image 2, and restrained Cosmic imagery for selected surfaces.

Reason: preserves the supplied visual identity while making capture, reading and retrieval easier.

Trade-offs: less spectacle in content-heavy screens; decorative atmosphere remains prominent on the landing page and dashboard.

MVP impact: address during wireframe/specification work, before component implementation. This is a recommendation, not a new approved visual specification.

## Missing states and responsive behavior

The references mostly show populated success states. Add sign-in/canceled OAuth/session expiry, first-use empty dashboard, loading, partial data failure, search no-results, autosave error/conflict, import validation, export progress/failure, Trash expiry/restore failure, AI disabled/quota/provider failure, no evidence, indexing pending and interrupted generation.

Mobile editor must prioritize writing with Edit/Preview switching and optional metadata drawer; do not squeeze desktop side panels into the viewport. Mobile chat must retain a reachable composer above the keyboard with sources in a drawer/sheet. Bottom navigation must respect safe areas and avoid covering content; consider hiding secondary chrome in focus mode while maintaining a clear exit.

Use shadcn/ui dialog/sheet/popover primitives where appropriate. Verify keyboard order, focus restoration, selected state labels, touch target spacing, contrast over gradients, zoom and reduced motion. Screenshot styling alone cannot prove contrast or accessibility. Prefer practical 44px touch targets where layout allows; maintain the project's documented accessibility target.

## What remains

[Screen blueprints](wireframes/README.md) are structural proposals. High-fidelity revisions, measured tokens, actual component states and responsive prototypes have not been produced. No application implementation is authorized by these references.
