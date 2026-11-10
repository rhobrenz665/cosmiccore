# Optional hosted and local AI

Status: Capability direction Approved; integration details Proposed | Checked: 2026-11-10

The owner requested optional free online models and their local AI. Both belong in the provider-flexible design. The owner later identified Ollama/Qwen ~7B and deferred local integration. The initial hosted planning choice is now Groq Free with GPT-OSS 20B; runtime/privacy/account validation remains pending. This supersedes treating local AI as development-only without further discussion; it does not authorize exposing a local service or provisioning a bridge.

## Proposed provider contract

Operator config defines approved provider IDs, model IDs, supported context/output size, streaming capability, privacy notice version and availability. Server endpoints accept a provider ID, never a user-supplied base URL or API key. Verify account entitlement and allowed execution mode before resolving private credentials. Keep chat and embedding provider choices separate; changing chat model does not require reindexing, changing embedding space does.

Use a small application-owned adapter for streamChat, cancellation, normalized error/usage and capability limits. Vercel AI SDK is a convenience candidate, not an automatic extra gateway or paid service. Do not promise provider feature equivalence. Record provider/model per generation attempt; permit selection only from configured available options. Never silently switch provider, send private context elsewhere, or fall through to a paid model when unavailable.

## Hosted free-tier candidate evidence — initial selection recorded separately

| Option | Evidence checked | Constraints and next validation |
|---|---|---|
| Gemini Developer API | [Official pricing](https://ai.google.dev/gemini-api/docs/pricing/) shows model-dependent free offerings and content-use disclosures | Search-visible pricing flags free-tier content use for product improvement; full table fetch failed in this session. Recheck exact model/region/terms and consent before sending private knowledge. No blanket privacy or free-capacity claim |
| GroqCloud | [Official limits](https://console.groq.com/docs/rate-limits) documents free-plan model limits, applied at organization level | Public app accounts share upstream quotas. Verify exact available model, rate/token allowances, error handling, privacy and commercial eligibility before enabling |
| Operator local runtime | Runtime/model still to confirm; [Ollama API](https://docs.ollama.com/api/introduction) provides local and cloud endpoints | Local inference is a separate mode from Ollama cloud. Hardware, selected model license, context size and speed require measurement; electricity/storage are not free infrastructure |

Free access to a consumer chat website does not establish a free API entitlement or permission to automate its UI. No scraping/chat-subscription workaround is proposed. A model described as open-weight may still cost money when hosted. Provider account configuration must enforce the $0 intent; app counters alone cannot guarantee upstream billing behavior.

## Local topology and trust boundary

**Local app + local inference:** run Next.js on the owner's computer and connect server-side to a fixed loopback runtime endpoint. Keep runtime credentials/config server-side. Cloud database/auth may still be used, so “local inference” does not mean the whole application is offline or that stored notes never leave the device. This is the simplest proposed first local mode.

**Hosted Next.js + owner's inference:** cloud `localhost` is the cloud runtime, not the owner's computer. A deployed server cannot reach the owner's private loopback endpoint by changing a base URL. A secured bridge/tunnel/VPN or outbound authenticated worker would be a concrete new infrastructure requirement. Choose it separately with access scope, identity, TLS, authorization, concurrency, lifetime/uptime, revocation and cost checks. Raw unauthenticated inference must not be exposed to the internet.

**Public browser + user's own inference:** browser mixed-content/private-network/CORS behavior and credentials need a separate local companion design; not assumed supported. Do not solve it by allowing arbitrary localhost/private URLs through server endpoints (SSRF risk). Public users must not gain access to the owner's compute merely because a local adapter exists.

[Ollama documentation](https://docs.ollama.com/api/introduction) distinguishes local requests without API authentication from authenticated cloud requests, including OpenAI-compatible endpoints. Its [FAQ](https://docs.ollama.com/faq) covers network binding/origin configuration. Those capabilities are not an authentication/security boundary for a public app. Ollama is confirmed as the owner's future local runtime; no integration is in current scope.

## Privacy and data transfer

Before a hosted request, show which provider receives the question and relevant source excerpts. Source ownership is checked before context assembly; only bounded relevant text is sent. Do not imply “private account” means no third-party processing. Require acknowledgment of the enabled provider's disclosure; store acknowledgment version rather than note content in audit logs.

Switching provider requires explicit selection/confirmation under the appropriate disclosure. A local-offline error never triggers hosted fallback. Local mode must also prove the selected runtime model actually runs locally, rather than relying on a cloud-backed runtime alias. Private prompt/response logging stays disabled/redacted in all modes.

## Cost, availability and evaluation gates

Use both per-user and global token/request reservations. Bound output, conversation history, retrieval context, concurrency and attempts. If a hosted free quota expires, provider is unavailable, local computer sleeps or local model is absent, display an actionable status and preserve user input/history. Keep notes/search available when their own infrastructure is available. Request timeout is bounded by host execution limits; local mode also needs cancellation/resource limits.

Evaluate candidate models on a small owned/synthetic note corpus: factual extraction, multi-source answer, missing evidence, stale/deleted source, prompt injection and conflicting sources. Measure retrieval separately, source-support correctness, stream latency, abort behavior, token usage and local memory/throughput. Run no live provider call with private content without approved credentials/disclosure. No benchmark has run.

Current remaining work: validate the selected hosted model/privacy configuration and proposed quotas; decide embedding strategy after lexical evaluation. Exact Qwen tag and local topology are deferred with the local milestone. Implementation and network changes remain unauthorized.

## Latest owner scope — 2026-11-10

Confirmed local runtime: Ollama with a Qwen model of approximately 7B parameters; exact model tag/quantization not specified. Local AI integration is explicitly deferred to a future milestone. Current AI work focuses on online models with free API access. Do not expose the owner's machine, create a bridge or include a local selector in the initial MVP. Hosted provider/model remains Proposed until quality, privacy and free-quota verification. This update supersedes pending questions about local availability for the current milestone.

## Initial choice and switching

Owner authorized proceeding with a switchable initial provider choice. [Hosted model selection](hosted-model-selection.md) records Groq Free / openai/gpt-oss-20b, 120B as an evaluation alternative, concrete proposed pilot caps and enablement checks. Earlier unselected-provider entries are historical; no service is enabled.
