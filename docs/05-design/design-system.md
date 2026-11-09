# Design system direction

Status: Draft — six user references reviewed on 2026-11-10

Use a single component tree with two independent settings: appearance = Cosmic/Minimal; color scheme = light/dark/system. Store preference per user with a safe local initial preference to avoid flashing. Focus Mode reduces navigation chrome without changing data or routes.

Define semantic CSS tokens for background, surface, foreground, muted text, border, primary, destructive, focus ring, radius, spacing and elevation. Cosmic adds restrained purple/blue gradients and decorative glass layers; Minimal uses solid surfaces. Choose exact color values after contrast checks. Decorative imagery must not impair text contrast or loading performance.

Use shadcn/ui primitives for dialogs, menus, forms and navigation where suitable, with Lucide icons accompanied by accessible labels. Use a readable system font initially. Target WCAG 2.2 AA: normal text 4.5:1, large text 3:1, visible focus, labeled controls, keyboard access, reduced motion, and non-color status cues.

Navigation: desktop sidebar with Dashboard, Knowledge, Notes, References, Chat and Settings; mobile compact header and proposed bottom navigation with a More sheet. Dashboard prioritizes quick capture, recent items, resume work and chat. Notes prioritize editor; knowledge uses filters and grid/list; chat shows sources beside or below messages.

Provisional layout breakpoints: below 768px single column, 768–1023px collapsible navigation, 1024px+ sidebar. Verify at 320px width and 200% zoom rather than treating breakpoints as device guarantees. Include skeleton/loading, retryable error, first-use empty, no-results, saving/saved/conflict and AI unavailable states. Keyboard shortcuts must avoid browser conflicts and have discoverable alternatives.

## Reference-informed refinement

See [reference review](reference-review.md) and [screen blueprints](wireframes/README.md). The owner explicitly treats supplied images as enhanceable references. Keep Cosmic decoration away from dense reading surfaces; use a compact appearance control rather than repeated toolbars. Deferred features depicted in images do not enter MVP scope. Exact tokens and responsive visual output remain to be validated.

## Quick light/dark switch — 2026-11-10

Owner requested a button to switch light/dark. Add one accessible shared-header button on desktop/mobile. First visit still follows System. Proposed interaction: resolve the current theme, then a click selects its opposite explicitly (light → dark, dark → light). Subsequent clicks alternate the explicit preference. Appearance settings retain Light/Dark/System so users can resume following the OS; Cosmic/Minimal is a separate control and is unaffected.

Use a shadcn/ui Button and decorative Lucide icon with a dynamic accessible action label (Switch to light mode / Switch to dark mode). Keyboard activation and visible focus must work. Show the current preference in settings so overriding System is understandable. For saved accounts, persist through the existing preference mutation with saving/failure handling; a failed save must not claim persisted success. No new theme framework or duplicated page tree is implied. Exact placement/style remains a visual refinement; no application code has been created.

## Approved first-visit defaults — 2026-11-10

Start in Cosmic appearance with System light/dark preference. The header light/dark button can set an explicit color preference; Appearance settings can return to System or select Minimal. This resolves the initial visual-style choice.
