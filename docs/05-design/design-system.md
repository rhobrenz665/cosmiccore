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

## Future learning surfaces

The [Interactive Visual Lab proposal](../04-features/interactive-visual-lab/spec.md) applies these tokens to a responsive lesson scene, synchronized captions and keyboard-operable playback. Its proposed mobile, reduced-motion and cross-theme checks apply when that future feature is prioritized.

## CosmicCore 2.0 audit and redesign proposal — 2026-11-22

Status **Proposed**. The objective is to make capture, retrieval, and writing faster to scan and easier to operate while carrying the Nebula identity into the signed-in workspace.

### Evidence reviewed

Inspected Next.js 16.4.6, React 19.3, Tailwind CSS 4.3, Base UI, Lucide, the shadcn Base Nova configuration, and the local Button and Sheet primitives. Reviewed the workspace routes, application CSS and appearance provider, plus the rendered Cosmic Dark and Minimal Light Dashboard wireframes and Cosmic mobile sign-in. The [interactive wireframe](wireframes/cosmiccore-brand-preview.html) has sample data. Signed-in browser behavior and measured contrast and performance remain unverified in this audit.

Ran the installed [UI/UX Pro Max skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) in design-system, shadcn stack, and focused UX modes. Adopt its flat, typography-first workspace treatment, chip reflow, visible-focus guidance, and emphasis on reusable navigation primitives. The generated teal/orange palette and sales-video layout do not fit the existing violet brand or a signed-in knowledge workspace. Keep the current component foundation and assess the registry Sidebar only if a later implementation review shows a clear lifecycle or accessibility benefit.

### Priority findings and design

| Priority and surface | Current evidence | Proposed improvement |
| --- | --- | --- |
| P1 · Theme and brand | Shared light/dark surface tokens carry most of the appearance. Cosmic selectors affect a few backgrounds, sign-in uses a gradient in either appearance, and the app shell still uses Sparkles. | Keep the existing appearance provider and independent color preference, including System. Separate semantic surface tokens for Cosmic and Minimal in both schemes. Adopt the folded C and star as a reusable mark with a compact rail version and a wordmark for sign-in. |
| P1 · Shell and navigation | Exact path matching loses the section highlight within deep note and reference routes. At tablet width CSS hides the visible link text with no independent label on the desktop links. | Use segment-aware navigation with a distinct current state and accessible link names in the rail. Retain native links, landmarks and the skip link. Put a clearly labeled link to Knowledge search in the header. Keep Settings and Trash in utilities and consolidate account controls in one reachable location. |
| P1 · Dashboard | Four quick actions share one row. Resume and recent lists compete at roughly the same emphasis. The wireframe has a large decorative hero in both appearances. | Lead with New note and Save reference. Keep Import near Notes and search in the header. Give Resume one concise row above recent notes and references. Retain independently recoverable regions and useful first-use actions. Use a compact planet crop in Cosmic and a normal page header in Minimal so recent work starts higher. |
| P1 · Knowledge | Query, filters, auto-submitting tags, sort, and view controls are spread across the search form and results header. Repeated tag changes submit separate navigations. | Make the query the dominant control. Show active filters as removable, wrapping chips. Group sort and view with results. Reuse Sheet for mobile filters with Apply and Clear. Preserve query URLs, all-selected-tag matching, and cursor reset when filters change. Keep results distinguishable by type and wrap long titles and URLs. |
| P1 · Notes | The editor already has autosave, status announcements, conflict preservation, split preview, Focus Mode and mobile Edit/Preview. | Establish one manuscript column, a compact labeled save state near the title, and desktop split preview when there is room. Keep organization near the title and move secondary actions into a compact menu if its keyboard behavior passes QA. Keep draft text and focus stable during save, failure, conflict and Edit/Preview changes. |
| P2 · AI Chat | The current route renders an availability placeholder. | Improve the current unavailable state and link to Knowledge. Once BUILD-10 and BUILD-11 provide retrieval and chat, propose a conversation list, readable thread, bounded composer, stop/retry states and source disclosure. Use a drawer for chat history on mobile and open citations through the existing authorized source surface. |
| P1 · Mobile | Bottom navigation already has five destinations, a More Sheet and safe-area padding. The review screenshot showed a clipped preview frame at its capture width. | Retain the five destinations and More. Use shared bottom insets and scroll padding so fixed navigation and the mobile keyboard leave focused elements in view. Verify at actual viewport widths and zoom, including the editor and sheets. |

### Visual and component direction

Use a single component tree. Cosmic Dark takes midnight surfaces and restrained violet highlights. Cosmic Light uses a lightly tinted canvas and white reading surfaces. Minimal Light and Dark use neutral surfaces with a restrained brand accent. Keep artwork on the Cosmic Dashboard and sign-in, with a solid or strongly masked text zone and responsive crops. Avoid repeating the planet in toolbars or data surfaces. Start with the existing system font. Proposed layout defaults are 16 px reading text, 14 px toolbar labels, a 4/8 px spacing rhythm and 44 px touch-sized primary controls. Define token values only after measuring foreground, muted, interactive and focus contrast in each scheme.

Reuse Button and Sheet, native form controls and existing feature actions. The data and API contracts remain the current ones. Filter submission timing and route-state presentation are UI changes. Preserve server-side ownership, current quota and permission checks, signed-in preference persistence and account lifecycle gates. Keep future chat views dependent on their feature contracts.

### Delivery and acceptance

Start with the shell, shared tokens, Dashboard and sign-in in a single design review. Then refine Knowledge, Notes and mobile layouts. Chat gets its unavailable-state polish now and its conversation experience when the corresponding builds are ready.

Before release, review the signed-in app in Cosmic and Minimal under light, dark and System at 320, 375, 768, 1024 and 1440 CSS px, with 200% zoom. Use long titles, many tags, empty lists, partial Dashboard errors, deep-linked notes and save conflicts. Confirm keyboard order, Sheet focus return, current section announcement and no focused control hidden by sticky UI. Verify WCAG 2.2 AA text and control contrast, including the brightest image crop. Check the actual network waterfall for artwork requests in Minimal, reserve art space to limit layout shift, and measure the Dashboard against its pre-redesign baseline on a simulated mobile connection. Prefer color and opacity changes for feedback and respect reduced motion.

### Approved appearance model — 2026-11-22

Cosmic is a single dark Nebula design. Minimal offers Light, Dark and System. This supersedes the earlier two-by-two appearance matrix. Existing color preferences become Minimal preferences and survive switching to Cosmic. First visit starts in Cosmic, with System as the initial Minimal preference. Use the generated planet artwork on Cosmic sign-in and Dashboard only.

The first implementation covers the shared shell, Dashboard, sign-in, Knowledge filters, note toolbar and Chat availability. The next planning pass should use signed-in screenshots and keyboard/mobile acceptance evidence to prioritize detailed Knowledge and editor improvements. Conversation design stays paired with the scheduled retrieval and chat builds.

### UI enhancement workflow

1. **UI/UX Pro Max leads product design.** Review the signed-in Dashboard, Knowledge, and Notes on desktop and mobile. Use its design-system and targeted UX searches to evaluate type, spacing, layout, color, and interaction hierarchy. Record specific findings and proposed changes against the approved Cosmic and Minimal identity.
2. **shadcn/ui plans the component changes.** Map each proposal to the project's Base Nova setup and existing Button and Sheet primitives first. Preserve the existing appearance provider, CSS variables, and saved preferences. Identify any extra primitive in the proposal before implementation.
3. **Vercel Web Design Guidelines reviews the proposal.** Check accessible labels and focus, responsive reflow, keyboard and touch behavior, feedback states, and performance. Mark what needs a browser test. Present the design and component mapping for owner approval.
4. **After design approval, shadcn/ui guides implementation.** Then repeat the Vercel review against the changed code and rendered screens. Verify Cosmic and Minimal Light/Dark/System with signed-in data before declaring the pass complete.

UI/UX Pro Max is installed. The official [shadcn/ui skill documentation](https://ui.shadcn.com/docs/skills) and [Vercel Web Design Guidelines skill](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) provide the upstream references for the other two stages.

### Appearance and Knowledge approval draft

The [interactive preview](wireframes/cosmiccore-brand-preview.html) is ready for owner review. The two design decisions are whether Appearance should lead with comparable theme cards and whether Knowledge should lead with a search field and keep filters in a disclosure. Linear's appearance settings, Notion's workspace search and Obsidian's separation of reading and editing informed the review. The preview uses original CosmicCore styling and sample records.

| Surface | UI/UX Pro Max direction | shadcn/ui implementation map after approval |
| --- | --- | --- |
| Appearance | Give the two cards equal weight and the same sample content. Use a visible Selected label and a programmatically announced state. Reveal Light, Dark and System for Minimal. Show a saving status and retain the previous preference if persistence fails. | Compose a Base UI Toggle Group for the labeled previews and another for Minimal color. Reuse the existing appearance provider, revision-checked save action, preference data and semantic tokens. The Cosmic swatch can use lightweight CSS. |
| Knowledge | Give search the strongest visual priority. Keep filters behind a disclosure and allow active controls to wrap. Give each result a linked title and explicit item type. Preserve search and filters on error and distinguish empty library, no matches, end of results and failure. | Reuse Button, the existing GET query contract and server-rendered result links. Use the existing Sheet with a title for mobile filters and an inline disclosure on desktop. Map field labels to Field, preserve all-selected-tag semantics, apply changes in one submission and clear the cursor when criteria change. Use current view and pagination contracts. |

**Vercel review.** The prototype uses labeled form controls, native keyboard-operable controls, visible selection text and focus styles, and polite status feedback. Long sample titles wrap in the rendered mobile layout. The responsive preview uses a disclosure to demonstrate filtering, with Sheet focus return reserved for the implemented app. The shadcn registry lookup was unavailable during this pass, so the component map uses the installed skill guidance, the checked-in Base Nova configuration and the existing component files.

Before shipping, run signed-in tests at 320 px and 200% zoom, check the full accessible name and keyboard order, verify focus after applying and removing filters, test query and selection preservation across reload and browser back, and measure contrast for all theme variants. Confirm empty, error, pending and retry states, successful preference persistence, and absence of a planet network request in Minimal. The preview demonstrates sample search by title and one tag. Production continues to support the existing full filter set.

### Cosmic dashboard reference alignment

Use the supplied desktop and mobile dashboard references for the violet active navigation state, right-weighted planet crop, and hierarchy from capture to recent work. Use the landing reference for art direction and the core-screen board for the quieter indigo panels. The approved folded C and single dark Cosmic appearance take precedence over the older stacked logo and color toggles in the references. Sample counters, pricing, interviews and integrations shown in those images do not change product scope.

The interactive preview applies the stronger planet crop and navigation treatment. The proposed app composition reuses the current shell, Button, Dashboard queries and linked recents. The preview uses sample destinations for recent entries. Before implementation approval, review the desktop and mobile balance between artwork and content. Signed-in verification still needs measured hero contrast, keyboard navigation, zoom, mobile focus visibility and actual data states.

### Immersive Cosmic approval candidate

The updated preview uses a new [orbital planet illustration](wireframes/cosmic-planet-orbit.jpg) with a visible planetary curve on Dashboard and sign-in. Dashboard places the strongest light on the right and uses a separate mobile crop with a dark text zone. Knowledge and Notes use solid ink surfaces, subdued borders and a violet current-page marker to carry the identity without artwork. Minimal keeps its existing Light, Dark and System behavior.

The refinement used UI/UX Pro Max contrast and hierarchy guidance, the existing shadcn Button and shell component mapping, and a Vercel guidelines review of focus styles, labels, readability and wrapping. Chrome rendered desktop and mobile Dashboard, Knowledge and sign-in. This is a visual review candidate. Before shipping, verify contrast over actual hero crops and signed-in keyboard and mobile interactions in the app.

### Immersive Cosmic implementation

Owner approved the immersive artwork and quieter work surfaces. Dashboard and sign-in use the orbit image, with separate narrow-screen crops. Reading surfaces use shared ink tokens. Minimal retains its saved color preference and skips the artwork request. The existing Button, shell and Dashboard data flow are reused. The exact static image path is public so signed-out visitors can see it. Workspace routes remain authenticated.

The production build passed signed-out Chrome checks for Cosmic, Minimal Light, Minimal Dark and Minimal System. Signed-in Dashboard and workspace review, keyboard focus and measured hero contrast remain the next acceptance tasks.
