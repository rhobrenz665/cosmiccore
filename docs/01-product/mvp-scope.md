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

## Approved account and backup policies — 2026-11-10

Confirmed account deletion blocks access immediately and targets removal of live app data within seven days, without a recovery grace period. Encrypted backups expire after seven days. The 7-day note Trash and 24-hour RPO target are unchanged. See [account lifecycle](../03-technical/account-lifecycle.md) for remaining implementation/history decisions. Earlier references to pending account/backup-retention approval are superseded by this confirmation; runtime verification and RTO remain outstanding.

## Current scope decision — 2026-11-10

Owner deferred application-managed backups and disaster recovery to a future milestone, outside MVP. Backup hosting remains undecided; no service is selected. The approved 24-hour RPO and seven-day encrypted backup retention apply to that future capability, not MVP guarantees or release gates. Existing provider history is incidental, not a promised recovery service. MVP keeps Markdown import/export, seven-day note Trash/restore, immediate account-deletion access blocking and live-data removal targeted within seven days. Cleanup required for those features remains in scope. This decision supersedes earlier backup/restore release gates in this document. No disaster-recovery guarantee is offered for MVP.

## Reference deletion confirmed — 2026-11-10

References are removed immediately from the live app after confirmation, without Trash. Linked notes survive; deleted references and derived sources are excluded from search/AI retrieval. The seven-day Trash policy applies to notes only. Historical generated excerpts remain subject to the separate chat policy.

## Optional hosted/local AI direction — 2026-11-10

Owner requested optional free online models and their local AI. Provider flexibility includes both modes, with exact runtime/model and hosted-to-local connectivity still unresolved. See [provider options](../03-technical/ai-provider-options.md) for trust boundaries, candidate evidence, $0 constraints and privacy requirements. No silent provider/paid fallback, arbitrary endpoint entry or public exposure of local inference is approved. Earlier development-only local assumptions are superseded by this capability request; deployment topology remains to be chosen.

## Latest owner scope — 2026-11-10

Confirmed local runtime: Ollama with a Qwen model of approximately 7B parameters; exact model tag/quantization not specified. Local AI integration is explicitly deferred to a future milestone. Current AI work focuses on online models with free API access. Do not expose the owner's machine, create a bridge or include a local selector in the initial MVP. Hosted provider/model remains Proposed until quality, privacy and free-quota verification. This update supersedes pending questions about local availability for the current milestone.

## Approved chat retention — 2026-11-10

Conversation history remains until the user deletes it, subject to storage limits. Confirmed conversation deletion removes live access immediately without Trash; dependent content cleanup is bounded and must not be undone by late generation. Deleting a source blocks future retrieval/citation access, while existing generated answer text remains until its conversation is deleted. Account deletion overrides retention under its approved policy. Implementation details remain Proposed.
