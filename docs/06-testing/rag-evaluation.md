# RAG and hosted-model evaluation plan

Status: Proposed — no live evaluation executed

Use synthetic or explicitly consented material. Record corpus revision/hash, query set, model/provider/config, tokenizer, prompt version, retrieval method and measured request usage. Avoid private notes in logs/public CI artifacts. Start with deterministic adapters for failure testing; bounded live comparisons require authorized credentials and provider disclosure.

## Proposed corpus and cases

Create 12–20 short synthetic notes/reference descriptions and at least 24 questions, including exact fact lookup, paraphrased lookup, cross-source synthesis, contradictory sources, irrelevant-only results, no answer, empty corpus, headings/code, obsolete source version, trashed/deleted source, source injection, hostile Markdown and two-user lookalike titles. Include references with only URLs to prove the model does not claim to have read the pages.

Annotate expected supporting chunk IDs, relevant facts, unanswerable questions and prohibited cross-user sources. Evaluate retrieval alone first; generation cannot fix a source it never receives. Compare lexical baseline with embeddings only if recall warrants additional cost/storage.

## Proposed gates

| Measure | Initial target | Verification |
|---|---|---|
| Authorization and deleted-source eligibility | Zero violations | All synthetic isolation/lifecycle cases, plus database race tests |
| Evidence retrieval | Supporting source in selected context for at least 90% of answerable labeled questions | Recall report per retrieval method; report paraphrase failures separately |
| Citation mapping | 100% rendered citation IDs map to actual authorized retrieved sources | Deterministic parser/source endpoint tests |
| Claim support | At least 90% of manually annotated factual claims supported by cited excerpts | Human review; source-ID validity alone does not pass |
| Unanswerable handling | No unsupported substantive answer on labeled no-evidence cases | Human review plus stub no-retrieval path |
| Injection/tool boundary | No unauthorized action/cross-user disclosure | Adversarial sources and deterministic tool-disabled runtime |
| Streaming/persistence | All specified cancellation/retry/final-commit cases pass | Provider stubs plus interrupted integration scenarios |
| Cost/latency | No paid usage and within configured request/quotas/deadlines | Free-account configuration verified; exact measured numbers reported, no guessed throughput |

These are Proposed test gates and small-corpus indicators, not statistical proof of general model accuracy. Report failures, corpus size and exclusions; do not average away isolation or deletion failures. If lexical recall fails, improve chunking/query design or evaluate embeddings before claiming the full grounded-chat MVP is ready.

## Provider selection record

For each candidate model record: production/preview status, exact model ID, account/region availability, free request/token limits and reset behavior, shared account quota, privacy/training/retention settings, context/output/reasoning limits, stream/abort behavior and terms eligibility. Keep alternatives small: one primary model plus an evaluated optional alternative, no automatic fallback. Do not send real user text before approved provider disclosure.

Outstanding selection is documented in [provider options](../03-technical/ai-provider-options.md); references there are point-in-time evidence, not a selected account configuration. Local Ollama evaluation is deferred with local integration.

## BUILD-10 lexical baseline — 2026-11-23

Ran the production PostgreSQL retrieval query against 12 labeled synthetic notes and 24 queries in a rollback-only transaction on the isolated development database. The original strict lexical query found 12/12 exact queries, 0/6 natural-language questions, and 0/3 paraphrases. After dropping stopwords and prioritizing full term coverage with a partial term fallback, it found 12/12 exact queries and 6/6 questions. It retrieved the expected source for 0/3 paraphrases, for 18/21 answerable queries overall (85.7%). All three no-match queries returned no evidence in this corpus. These are synthetic results. The proposed 90% retrieval target remains open. Evaluate how to improve paraphrase recall before enabling hosted grounded chat. No embedding or inference provider was used.
