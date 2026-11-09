# Proposed MVP scope

Status: Proposed — audience, budget and interview deferral confirmed on 2026-11-10

## Confirmed constraints

Personal use for the owner and family; $0 starting monthly operating budget; mock interviews in the next milestone. Separate private accounts and Google sign-in are confirmed. Anyone can register with Google; no family allowlist or invitation is required. Shared knowledge is outside the initial MVP. Paid services and automatic paid overages are outside budget; hosted AI requires a verified no-charge option or remains unavailable until feasible.

## Include

- Private account/profile/settings; ownership enforced for all data.
- Dashboard: recent notes/references, quick actions, resume recent work; AI shortcut.
- Markdown-first note CRUD, debounced autosave with visible status and revision conflict handling, individual `.md` import/export and bulk Markdown export. Markdown editor with preview, flat collections and tags are confirmed by the owner.
- Flat collections, tags, manually linked notes/references, list/grid views, PostgreSQL full-text search and filters.
- Saved HTTP(S) website/GitHub URLs with user-entered title/description. Saving a URL does not imply crawling its content.
- Bounded RAG over notes and saved descriptions, source citations, conversation history and streaming. Vector embeddings are subject to validation; lexical retrieval is an explicit fallback, not equivalent semantic search.
- Shared components with Cosmic/Minimal appearances, each supporting light/dark/system, responsive layouts, accessibility, reduced motion, and focus mode for notes/chat.

## Proposed deferrals

Confirmed: mock interviews belong in the next milestone: they add evaluation, prompt and history workflows before the capture/retrieval loop is proven. A clearly labeled Coming later entry is optional, with no broken action.

Defer binary file/PDF/Word imports, rich-text editing, automatic web crawling, nested collections, MCP tool execution/server hosting, voice, native apps, offline sync, graphs, analytics, Telegram and user-configurable remote Ollama.

Family sharing: deferred. The owner confirmed private accounts; no cross-account sharing belongs in the initial MVP.

## Release gates

Audience and budget confirmed; family access boundaries resolved; auth and provider choices documented; isolation and recovery verified; save/search/export work without AI; ingestion is resumable; quotas and timeout behavior visible; citations resolve only to authorized current sources. Full details follow in feature specifications.

## Confirmed note recovery decisions — 2026-11-10

7-day private Trash with immediate exclusion from normal lists/search/AI retrieval; owner can restore before expiry. Major-failure recovery target: at most 24 hours of lost changes. The backup mechanism is unverified under $0; RTO and backup/account/history retention remain unresolved. See [retention and recovery policy](../07-deployment/data-retention-and-recovery.md).
