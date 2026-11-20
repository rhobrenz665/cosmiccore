# Interactive Visual Lab

Status: Future / Proposed / Not Started | Design direction approved 2026-11-18

## Objective and owner direction

Help a learner explain why a system behaves as it does by changing a scenario, predicting an outcome, and inspecting each step. The owner approved a polished, accessible, 2D lesson viewer first, with local playback, reusable components, Cosmic and Minimal appearances, and low ongoing costs. Make one exemplary lesson, then test reuse in a second subject. Private authoring and AI assistance are longer-term directions. Phase details, numerical targets and library choices below are proposals. Implementation requires separate authorization after the MVP and already prioritized mock interviews.

## Explore workflow

Open a curated lesson paused at its initial state. Present its question, assumptions and controls. Offer play, pause, previous/next step, restart, speed and a choice of bounded scenarios. Selecting an object reveals its explanation. An optional prediction is local to the session. Reveal the outcome and its reason together. A scenario change announces a reset to step one.

First proposed example: round-robin distribution across healthy servers A, B and C. Six requests go to A, B, C, A, B, C. Ask who receives request three. Replay with B unavailable from the start: A, C, A, C, A, C. Explain that this model skips unavailable servers and assumes equal weights. Second proposed example: an approval workflow where a declared threshold changes the next reviewer. Its branching narrative should reuse playback, captions and controls. Plots, continuous motion, biological processes and other subjects can later use different models.

## Visual and interaction design

Use one shared viewer for Explore, editor preview and future private note embeds. On desktop, compose the scene alongside the step narrative. On phones, stack scene, caption and controls and reorient the diagram where necessary to keep labels legible. Give the lesson a useful first frame. Keep the camera steady during normal playback. Use motion for transfer, a brief emphasis for a changed value and a persistent label for the result. Distinguish active, selected, unavailable and keyboard focus through shape, text and contrast.

Reuse the [design system](../../05-design/design-system.md), shadcn controls, Lucide icons, semantic tokens and shared appearance settings. Cosmic can frame a scene with a restrained gradient. Minimal relies on spacing, type and line weight. Keep dense content on legible surfaces. Review both appearances in light and dark, including System changes. Provide labeled controls, visible focus and a synchronized text outline. Reduced motion presents equivalent states immediately. Prediction and later authoring need keyboard alternatives to spatial gestures. Focus Mode can use the same component tree.

## Definition, playback and rendering

Start inside the existing Next.js application. Ship curated examples as small static assets. The browser validates a definition, computes logical states and draws the selected step. Back during an animation cancels the transition and selects the requested state immediately. Counters, caption, outline and drawing derive from the same state. Speed affects visual timing only. Opening, replaying, seeking, revealing a prediction or adjusting a scenario needs no inference or persistence.

Use application-owned, versioned JSON with a lesson family and behavior-model version, title, objective, assumptions, provenance, nodes, edges, positions, supported styles, bounded parameters and defaults, ordered steps, durations, annotations, predictions, playback settings and allowlisted interactions. An authored sequence lists states explicitly. A computed lesson uses a reviewed function for its family to derive a bounded trace. Keep the saved-record revision separate from both format and model versions. Test old fixtures on upgrades. Reject unsupported versions with a clear explanation.

| Choice | Recommended use and tradeoff |
|---|---|
| React, SVG, HTML and CSS | First viewer. Custom-build responsive lesson composition, captions, meaningful movement and direct step selection. Use ordinary HTML controls. |
| [Motion](https://github.com/motiondivision/motion) | Optional open-source transition library once custom coordination becomes costly. Configure reduced motion explicitly. |
| [React Flow](https://reactflow.dev/learn/advanced-use/accessibility) | Evaluate for the desktop Creator editor when authors need drag, connections, selection and viewport controls. Keep its canvas serialization internal. Paid Pro resources are optional. |
| D3 / Canvas | Introduce D3 scales or layouts for a real chart requirement. Profile dense SVG scenes before taking on Canvas hit testing and an equivalent accessible representation. |
| Mermaid | Optional constrained text interchange. Warn about loss of unsupported timelines and interactions. Prefer versioned JSON for fidelity. |
| Three.js / React Three Fiber | Separately load only for a demonstrated spatial learning objective. Budget GPU, mobile controls and an alternative explanation. |
| [GSAP](https://gsap.com/community/standard-license/) | Exclude from the default shortlist. Its no-charge license restricts certain competing no-code animation builders. Reassess the terms before considering it for Creator Mode. |

Introduce a second trusted renderer only when a lesson needs it. A public plugin API, animated backgrounds and per-frame React tree updates would add maintenance or rendering cost to the first viewer.

## Creator, library and integration

A learner can eventually duplicate a template, edit labels, parameters and annotations, preview, save privately and reopen at a specific step from a note. Later an author can place nodes, connect them, reorder steps, edit transitions and inspect broken references before saving. Provide a keyboard form alongside drag-and-drop. Start with explicit Save. Preserve local input on validation errors, network failure and revision conflicts. Distinguish pending, saved and uncertain outcomes. Include empty catalog/library/search and unavailable embed states.

Reuse the [private mutation conventions](../first-workflow/contracts.md). Proposed operations are list/get, create, duplicate, update with expected revision, delete, attach/detach and export. Derive ownership from the active server session. Check it on reads, embeds, exports and writes. Use owner-matched relationships, retry receipts and transactional quotas. Consider a Neon PostgreSQL JSONB definition plus relational owner, title, revision and organization fields. Account deletion blocks access immediately and includes lesson data in cleanup. Visualization deletion, recovery and revision retention need an owner decision.

Associate lessons with private notes and saved reference metadata. A saved URL grants no permission to fetch a remote article or video. Reuse library organization when justified. Step-linked flashcards, a contextual AI tutor, offline viewing, community templates and sharing each require separate scope. Private offline caches would need logout/account-switch handling. Do not publish personal copies in the curated catalog.

## AI generation and validation

An explicit prompt selects a supported family and proposes parameters and annotations. For example, “add a fourth server” produces an editable candidate against the current revision. Trusted logic computes the assignments. Show affected objects, steps and predictions before applying the edit. Retain the last valid draft on error. Unsupported requests should identify the unsupported behavior and offer an available family.

Validate imports, stored data, editor saves and AI output. Enforce supported schema/model versions, unique IDs, valid targets, finite numeric parameters, safe text and allowlisted actions. Bound bytes, nesting, nodes, edges, steps, duration and execution work. Reject scripts, callbacks, raw markup, arbitrary styles and external assets. Validate at the server boundary and before browser rendering. Compare predictions and factual captions against reviewed traces. Schema validity alone cannot verify educational accuracy.

For generation from notes, use the [grounded chat boundaries](../ai-chat/spec.md), server-resolved source revisions and provider disclosure. Recheck account, source access and target revision before accepting a result. Resolve retention of copied source text before enabling this workflow. Keep private definitions out of shared caches and logs. Reserve bounded user/global input, output and concurrency before inference. On timeout, invalid output or exhausted quota, explain the outcome and permit manual editing. Retries are explicit and budgeted. No automatic paid fallback.

## Incremental roadmap and cost

Solo-developer planning estimates assume two short lessons, reuse of the app shell and focused engineering weeks including accessibility checks. Content review and editor usability are the largest uncertainties. These are independent future releases.

| Phase | Deliverable and dependency | Rough effort | Acceptance evidence |
|---|---|---|---|
| Explore | Two curated lessons using a shared client viewer and accessible controls | Medium, 2–4 weeks | A learner explains an unseen scenario. Back, replay and stepping agree on outcomes in both subjects. |
| Customize | Private template copies, parameter editing, save/reload and note links using existing auth and quotas | Medium–high, 3–6 weeks | Round trip preserves behavior. Foreign embeds disclose no title. Conflicts retain drafts. Retry creates one copy. |
| Author | Graph and timeline editing once template limits are demonstrated | High, 4–8 weeks | Author creates a third lesson without code, including by keyboard. Removing an object identifies dependent steps. |
| Generate | Constrained generation and reviewable edits using a verified provider budget | High, 3–6 weeks for pilot | Evaluate valid output, correctness, accepted edits and tokens per accepted lesson including rejected drafts. |
| Advanced | Consider simulations, 3D, richer exports or sharing individually | Very high, unestimated | Separate learning objective, privacy review, device evidence and budget for each extension. |

Measure transfer and cold-load size, lazy-load heavy editor/rendering dependencies, keep frames and predictions in memory and bound stored copies, history and thumbnails. Profile GPU effects, battery and slow devices. Track licenses for code, templates, fonts and icons. Budget editorial review, accessibility checks and theme regressions. Verify actual allowances against the [cost assessment](../../07-deployment/cost-analysis.md) before enablement.

## Proposed verification and open decisions

- Test trace invariants with fixed multi-subject fixtures. Interrupt transitions with rapid Next/Back and change speed. Verify final caption, selected object, counters and focus.
- Test the busiest supported lesson on a named midrange phone. Proposed warmed-viewer target: visible feedback within 100 ms of a playback tap. Measure dropped frames separately. Confirm zero network inference or database writes during ordinary playback.
- Check 320 CSS pixels, 200% zoom, keyboard-only use, spoken screen-reader output and reduced motion across Cosmic/Minimal and light/dark. Pilot whether a first-time learner can predict, inspect and explain a new outcome.
- Test oversized/unsupported definitions, invalid targets and misleading predictions. For persistence test two-account isolation, deletion races, retries and stale revisions. Use provider stubs for disabled AI, timeout, invalid output and quota exhaustion.
- Before viewer implementation, choose the two examples, target phone, fixture size and measured resource caps. Before persistence decide deletion, recovery and history. Before AI decide copied-source retention, evaluation threshold and budget. Keep 3D, public sharing and library selection Proposed.

The current project milestone is BUILD-06.1 reference planning. See the [future backlog](../../01-product/feature-backlog.md).
