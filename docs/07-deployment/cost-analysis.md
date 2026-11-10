# Free-tier assessment

Status: Draft | Official sources checked: 2026-11-10 | Currency: USD

## Verified baseline

[Vercel Hobby](https://vercel.com/docs/plans/hobby) is for personal non-commercial use. Published allowances include 100 GB fast data transfer, 10 GB origin transfer, 4 active CPU hours, 360 GB-hours provisioned memory and one million function invocations. Overages can pause features; a commercial release requires reassessing hosting.

[Vercel function limits](https://vercel.com/docs/functions/limitations) list a 300-second Hobby maximum with Fluid Compute, including streaming duration, and a 4.5 MB request/response payload limit (streamed responses excepted). Treat these as ceilings, not latency goals or durable job guarantees.

[Neon pricing](https://neon.com/pricing) currently lists a $0 plan with 100 CU-hours monthly per project, 1 GB storage per project and compute up to 2 CU. This is a point-in-time allowance, not a permanent entitlement.

## Feasibility and unresolved checks

A small personal pilot may fit these tiers; hosted AI is not guaranteed free. No exact monthly estimate is credible without users, activity, context size and provider prices. Before launch, verify account-specific quotas, Neon egress/connection/branch/restore limits, Vercel deployment/build limits, and exhaustion behavior. Cold starts and AI latency need measurement.

| Component | Initial approach | Cost/risk and verification gate | Upgrade/portability |
|---|---|---|---|
| Hosting | Vercel Hobby if eligible | CPU/memory/bandwidth/request budgets; commercial eligibility | Paid hosting; ordinary Next.js deployment |
| Database | Neon free | Text, vectors, indexes and branches consume storage; egress and connection caps unverified | Paid tier or PostgreSQL migration |
| Authentication | Evaluate managed Neon Auth against self-managed Better Auth | MAU, OAuth, email delivery, session limits and terms unverified; no free auth guarantee | Provider mapping isolates identity |
| AI | One selected hosted model; local Ollama for development | Tokens, rate limits, retention and embedding prices unverified | Application-owned adapter; re-evaluate quality |
| Files | Defer binary uploads | No object-storage dependency initially | Evaluate storage/egress/signed URLs when needed |
| Jobs/MCP | No separate service initially | Bounded retryable ingestion only; no always-on process | Durable worker only with concrete requirement |
| CI/monitoring | GitHub CI and host logs, proposed | Minutes, storage, retention and alerts unverified | Add service only for demonstrated gaps |

Budget model: chat requests × (input tokens × input price + output tokens × output price) + new/changed embedding tokens × embedding price + hosting/database/egress costs. Prices must use matching token units. Example workload for estimation only: 1 user, 10 chats/day, 30 days, 3,000 input and 500 output tokens/chat = 900,000 input and 150,000 output tokens/month, plus embeddings.

Raw float32 vector payload ≈ chunks × dimensions × 4 bytes: 10,000 × 768 ≈ 30.7 MB before row, index, text and version overhead. This is arithmetic, not a capacity promise or chosen embedding dimension.

Propose hard per-user and global request/token budgets, atomic quota reservations, bounded context/output, content-hash embedding reuse, explicit retries and AI disablement when exhausted. Never silently upgrade or switch to a paid provider. Database/hosting exhaustion may also interrupt non-AI features; do not promise continued availability then.

Local development avoids hosted inference charges but consumes hardware, electricity and setup time. Self-hosting shifts operational burden. PostgreSQL and Markdown reduce data lock-in; embeddings must be regenerated if model/dimension changes.

## Owner clarification — 2026-11-10

The app is publicly accessible, including personal use by the owner and family. Starting monthly budget is $0; no paid services or automatic paid overages are authorized. Mock interviews are confirmed for the next milestone. Separate private accounts and Google sign-in are confirmed. Public Google registration is confirmed; the auth library/service remains to be evaluated. These confirmations supersede earlier audience/budget assumptions in this draft.

## Public launch clarification and refreshed sources — 2026-11-10

Anyone can register with Google. Public registration and commercial use are separate product attributes; do not infer hosting eligibility from registration visibility alone. Verify actual use against current hosting terms before launch. The [Vercel Hobby terms](https://vercel.com/docs/plans/hobby) retain personal/non-commercial restrictions.

The [Neon pricing page](https://neon.com/pricing) lists Managed Better Auth in its free offering. This confirms availability, not unlimited authentication or all production requirements: account-specific auth limits and OAuth configuration still need checking. The managed auth recommendation reduces operating tasks, while the app remains responsible for authorization.

Recommendation: launch with bounded storage/writes and AI disabled until verified free inference is available. Reason: public users can exhaust a private developer's free allowances. Trade-offs: users may encounter quotas and AI may be unavailable; no new paid service is added. MVP impact: a knowledge-only pilot can precede the full AI MVP, with the distinction disclosed.

## Auth validation checkpoint

[Auth integration validation](../03-technical/auth-integration-validation.md) records refreshed official auth allowances and remaining account-specific checks, plus the SMTP applicability issue for Google-only production. No $0 production guarantee is established by an available free tier. Backup feasibility remains independent.

## Lifecycle and maintenance planning

See [account lifecycle](../03-technical/account-lifecycle.md) for Proposed deletion/history policies, and [backup/cleanup feasibility](backup-and-cleanup-plan.md) for validated tool capabilities and remaining operational gaps. Immediate logical expiry is distinct from delayed physical purge. The 24-hour RPO remains unverified until the backup/restore workflow is tested.

## Current scope decision — 2026-11-10

Owner deferred application-managed backups and disaster recovery to a future milestone, outside MVP. Backup hosting remains undecided; no service is selected. The approved 24-hour RPO and seven-day encrypted backup retention apply to that future capability, not MVP guarantees or release gates. Existing provider history is incidental, not a promised recovery service. MVP keeps Markdown import/export, seven-day note Trash/restore, immediate account-deletion access blocking and live-data removal targeted within seven days. Cleanup required for those features remains in scope. This decision supersedes earlier backup/restore release gates in this document. No disaster-recovery guarantee is offered for MVP.

## Optional hosted/local AI direction — 2026-11-10

Owner requested optional free online models and their local AI. Provider flexibility includes both modes, with exact runtime/model and hosted-to-local connectivity still unresolved. See [provider options](../03-technical/ai-provider-options.md) for trust boundaries, candidate evidence, $0 constraints and privacy requirements. No silent provider/paid fallback, arbitrary endpoint entry or public exposure of local inference is approved. Earlier development-only local assumptions are superseded by this capability request; deployment topology remains to be chosen.

## Latest owner scope — 2026-11-10

Confirmed local runtime: Ollama with a Qwen model of approximately 7B parameters; exact model tag/quantization not specified. Local AI integration is explicitly deferred to a future milestone. Current AI work focuses on online models with free API access. Do not expose the owner's machine, create a bridge or include a local selector in the initial MVP. Hosted provider/model remains Proposed until quality, privacy and free-quota verification. This update supersedes pending questions about local availability for the current milestone.

## Initial hosted inference choice

[Hosted selection](../03-technical/hosted-model-selection.md) records Groq Free GPT-OSS 20B, actual documented Free-limit evidence and proposed pilot ceilings. Published request limits do not establish full-context chat capacity; shared token limits dominate. No billing upgrade, gateway credits or automatic paid fallback is authorized.
