# Initial hosted model selection

Status: Approved initial planning choice; deployment validation pending | Checked: 2026-11-10

Owner authorized proceeding with an initial choice while retaining future switching. Select GroqCloud Free with `openai/gpt-oss-20b` for the first evaluated chat adapter. `openai/gpt-oss-120b` is a same-provider evaluation alternative, not automatic fallback. This is Groq-hosted inference, not an OpenAI API subscription. No account configuration, key use or model call has occurred.

## Evidence and comparison

| Candidate | Current evidence | Disposition |
|---|---|---|
| Groq `openai/gpt-oss-20b` | [Production catalog](https://console.groq.com/docs/models) lists it as production, 131,072-token context and 65,536 max completion | Initial planning choice; use much smaller app budgets and validate grounded quality |
| Groq `openai/gpt-oss-120b` | Same catalog lists production and the same context/completion limits | Evaluate if 20B misses quality gates; do not infer quality from parameter count or silently route requests |
| Gemini `gemini-2.5-flash-lite` | [Pricing](https://ai.google.dev/gemini-api/docs/pricing.md) lists free input/output access | Not default for private knowledge: unpaid data-use terms need resolution |

[Groq Free limits](https://console.groq.com/docs/rate-limits) currently list each GPT-OSS candidate at 30 RPM, 1,000 RPD, 8,000 TPM and 200,000 TPD. Limits are organization-scoped and account-specific exceptions are possible. Check actual console limits/headers before enabling; two model entries do not establish twice the organization's usable budget. Do not use paid Developer-plan catalog limits as Free allowances.

[Groq privacy](https://console.groq.com/docs/your-data) describes default non-retention of inference content with reliability/abuse exceptions up to 30 days, and ZDR controls available to customers. Usage metadata remains collected. Propose enabling ZDR and disabling persistence-dependent features, then confirming the setting and disclosure; no absolute zero-processing promise. Provider retention is separate from CosmicCore chat storage/deletion.

[Google unpaid terms](https://ai.google.dev/gemini-api/terms) restrict submitting sensitive/confidential/personal information and describe content use/review. Search-index evidence was available, but direct full-page fetch failed; recheck live terms and applicable region/account before use. A user checkbox alone does not resolve a provider restriction. Gemini is suitable only for a separately reviewed compatible workload, such as synthetic evaluation, unless the private-knowledge terms issue is resolved. No claim that Gemini cannot ever fit the app under a different plan/terms.

[Groq billing](https://console.groq.com/docs/billing-faqs) distinguishes Free from a payment-method-backed Developer upgrade. Stay on verified Free; do not add billing or upgrade under the $0 authorization. No prepaid gateway or billed fallback is proposed.

## Recommendation rationale

Recommendation: start with one direct hosted adapter and one operator-configured primary model. Reason: limits scope and configuration burden while allowing comparison. Trade-offs: throughput remains small, provider availability is external, and local hardware is unused for MVP. MVP impact: exact selection is recorded, but quality and free-account availability remain enablement gates, not proven results. Published speed/model capability is not our measured grounding quality.

## Proposed quota profile for the first pilot

The previous generic 6,000-token input default is too close to an 8,000 TPM shared allowance for concurrent public requests. Propose model-profile overrides: 4,000 input tokens maximum across instructions/question/history/sources, 1,536 max completion tokens including reasoning, one global in-flight generation, one per user, and at least 60 seconds between provider starts. A provider response/header can demand a longer delay. Reserve input+completion conservatively, including retries and uncertain requests.

Proposed pilot ceiling: 150,000 global reserved/settled tokens/day and 24 provider attempts/day, with 5 attempts/user/day. These numbers are app choices, not vendor guarantees. Worst-case 24 × (4,000 + 1,536) = 132,864 tokens/day, leaving headroom under the published daily cap. One full-sized request per minute fits the simple published TPM arithmetic but is not proof of vendor admission; tokenizer estimation, output reservation, organization sharing and rolling windows still need validation. Public registration remains open even when AI allowance is exhausted; explain AI unavailability without affecting notes/search where their infrastructure permits.

[Groq reasoning documentation](https://console.groq.com/docs/reasoning) supports low/medium/high effort on these GPT-OSS models. Propose low effort for bounded grounded answers; do not expose or persist raw reasoning as user answer. Verify completion accounting and whether 1,536 tokens leaves enough final-answer space. If output truncates, mark it incomplete and tune within quota; do not silently increase budgets or auto-retry.

The app's 3,000-token retrieval limit remains a ceiling; input assembly must fit all content into the lower 4,000-token total, reducing history/source count as necessary. No query-rewrite, summarization, reranking or embedding API call is bundled into the generation budget. Lexical-first RAG avoids an embedding-provider dependency for the first evaluation; insufficient recall still blocks quality acceptance.

## Switching and migration rules

- Keep provider/model IDs, capabilities, tokenizer, timeout and disclosure version in server configuration; allowlist IDs. Never accept arbitrary user-entered base URLs/credentials.
- Preserve application-owned chat, attempts and citation mappings. Each new attempt records the actual configuration; old answers retain original provider/model metadata.
- Switching chat model changes prompt/token/stream handling and requires regression evaluation, quota/privacy review and explicit disclosure where relevant. It does not re-embed notes.
- Changing embedding model/dimension creates a new vector space and requires versioned reindexing before activation. No embedding model is selected here.
- Provider errors never trigger automatic cross-provider or paid fallback. Intentional operator changes apply to new attempts, not silently to an active stream.
- Local Ollama/Qwen ~7B remains future scope; no tunnel, bridge or local picker now.

## Evidence required before enabling

Verify the actual Free account/model access, ZDR and limits; approve user-facing processing disclosure; validate compatible SDK/transport and reasoning accounting; run the synthetic [evaluation plan](../06-testing/rag-evaluation.md); check cancellation, persistence, no-evidence and quota failures; configure global caps and kill switch. Credentials/setup and implementation require separate authorization. No inference benchmark or production readiness claim has been made.
