# Owner questions and technical risks

Status: Draft

## First discussion — resolved on 2026-11-10

Owner answers: public access, including personal use by the owner and family; $0 starting budget; mock interviews next milestone. The table below preserves the original alternatives for context.

## Original first-discussion options

| Question | Recommended default | Alternatives and consequences | Blocking point |
|---|---|---|---|
| Who uses the first release, and is it commercial? | Personal non-commercial pilot; private per-user ownership | Invite-only multi-user adds abuse/identity needs; public/commercial launch changes hosting eligibility and operations | Release scope and hosting approval; drafting can continue |
| What monthly budget and overage behavior are acceptable? | $0 hosted infrastructure target; disable AI at budget exhaustion | Explicit small paid ceiling improves model availability; higher budget enables more usage. A zero ceiling may mean local-only AI during development | Hosted AI/provider approval; drafting can continue |
| Include mock interviews in the first release? | Next milestone after capture/search/chat | Include now with reduced scope elsewhere and additional prompt/evaluation work | MVP acceptance contract |

## Family access — resolved on 2026-11-10

Owner confirmed separate private accounts and Google sign-in. Notes, references, conversations, search and RAG sources must remain scoped to the signed-in person. Sharing is deferred. Public Google registration is confirmed; the auth library/service remains a proposed technical choice.

## Later discussion groups

| Question | Default | Alternative / consequence | When needed |
|---|---|---|---|
| Shared knowledge eventually? | Possible future extension, private ownership now | Team workspaces require membership/role design | Before schema approval if sharing is near-term |
| Managed or self-managed auth? | Evaluate managed Neon Auth first | Better Auth self-managed increases operational/security work | Before auth specification |
| Guest access? | No guest access proposed; Google sign-in confirmed | Guest sessions complicate ownership and retention | Before auth implementation |
| Collections nested? | Resolved: flat collections plus tags | Nesting deferred | Confirmed 2026-11-10 |
| Markdown and transfer formats? | Resolved: Markdown editor/preview, individual .md import/export, bulk Markdown export | Rich-text deferred; export packaging still to specify | Confirmed 2026-11-10 |
| PDFs/files initially? | Defer | Extraction/storage and jobs broaden scope | Before ingestion design |
| Model provider? | One hosted provider selected by quality, privacy and budget evaluation | Multiple providers add failure/privacy complexity | Before hosted chat |
| Ollama availability? | Development-only | End-user local connectivity requires separate architecture/security work | Before provider integration |
| Embeddings? | One fixed model/dimension after evaluation; lexical search first | Local embeddings reduce API cost but need compute; hosted embeddings incur token charges | Before vector schema |
| Provider unavailable? | Keep knowledge tools available; explicit retry, no silent provider switch | Approved fallback has privacy/cost implications | Before chat release |
| Always available services? | Interactive app only; tolerate pilot cold starts | Availability guarantees require paid resources and monitoring | Before deployment |
| Data retention and recovery? | Minimize retention; define explicit deletion and backup policy | Longer history/backup windows retain private content and cost storage | Before release |

## Risk register

| Risk | Mitigation / validation gate |
|---|---|
| Cross-user disclosure | Owner-scoped queries, composite ownership constraints, two-user negative tests |
| Autosave overwrites | Revision checks and recoverable conflict UI |
| RAG hallucination/injection | No executable tools, untrusted source boundaries, citation mapping and no-answer evaluation |
| Stale/deleted source exposure | Version checks, immediate retrieval exclusion, citation authorization |
| Request termination during indexing/chat | Small batches, durable attempt state, idempotent retries, explicit incomplete status |
| Free-tier exhaustion | Usage caps, dashboard alerts, AI kill switch, honest outage behavior |
| Unsafe URL fetching | Manual metadata MVP; future fetcher requires SSRF controls including redirects/private networks |
| Backup assumptions | Verify retention and perform restore drill before launch |
| Vector/provider mismatch | Store model/version/dimension; reindex before activating incompatible model |
| Auth/preview configuration | Separate environments and callback/origin verification |

Decisions remain Proposed until the owner's answers are recorded in [the decision register](architecture-decisions.md).

## Current scope decision — 2026-11-10

Owner deferred application-managed backups and disaster recovery to a future milestone, outside MVP. Backup hosting remains undecided; no service is selected. The approved 24-hour RPO and seven-day encrypted backup retention apply to that future capability, not MVP guarantees or release gates. Existing provider history is incidental, not a promised recovery service. MVP keeps Markdown import/export, seven-day note Trash/restore, immediate account-deletion access blocking and live-data removal targeted within seven days. Cleanup required for those features remains in scope. This decision supersedes earlier backup/restore release gates in this document. No disaster-recovery guarantee is offered for MVP.
