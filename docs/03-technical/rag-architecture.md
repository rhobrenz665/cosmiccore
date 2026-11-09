# Rag Architecture

Status: Draft — specification placeholder

Initial sources: note Markdown and user-authored reference metadata. URL saving does not authorize fetching page contents. Strip unsafe markup for rendering while preserving useful source text for retrieval.

Proposed ingestion: normalize text, chunk by headings with bounded token size/overlap, hash content, record source revision, generate embeddings only for changed chunks, activate a complete matching version atomically. Chunk sizes/model/dimensions require evaluation. Durable states: pending, processing with lease, ready, failed; retry expired work idempotently. Small explicit batches fit requests; automatic background completion is not promised.

Retrieval: apply owner and current-version filters, lexical search initially, evaluate vector/hybrid ranking later; cap candidates, context and output tokens. Context includes stable source identifiers; server maps citations only to retrieved authorized sources. A valid source ID is not proof of entailment: evaluate claim support. No evidence means a clear insufficient-evidence response. Retrieval failure is distinct from zero matches.

Store messages, attempts and source mappings; mark partial streams incomplete. Recheck deleted sources on retrieval and citation access. Keep prompt instructions separate from untrusted retrieved text, with no tool execution. Reserve quotas before provider calls, reconcile usage after calls, and conservatively account for interrupted calls. Avoid automatic retry after partial generation.

Pending: provider/privacy/retention comparison, evaluation set, embedding dimension and extension support, latency/cost budgets, exact chunking, deletion policy and durable worker trigger. Vercel AI SDK is a candidate convenience layer, not a chosen provider.
