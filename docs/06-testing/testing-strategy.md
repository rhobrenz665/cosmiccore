# Testing strategy

Status: Draft

Future implementation: unit tests for validation, chunk/version and quota rules; integration tests against isolated PostgreSQL for ownership, transactions, conflicts and deletion; end-to-end tests for sign-in/capture/search/export/chat. Use two accounts to test IDOR across every record, search, source and conversation path.

AI evaluation: small curated question/source set including irrelevant sources, no-answer cases, injection attempts, stale/deleted notes and citation mismatches. Check retrieval separately from answer quality; use deterministic provider stubs for CI and bounded live checks outside routine tests.

Exercise interrupted streams, provider 429/timeout, retry idempotency, browser reload during save, concurrent editors, quota races and indexing retries. Verify keyboard/mobile and all appearance/color combinations; test reduced motion and contrast. Validate Markdown export/import fidelity for MVP. Independent database-backup restore drills belong to the future backup milestone.

Planning verification: check Markdown links and document status/scope consistency. No application test suite is appropriate yet.

## First workflow specification

See [workflow detail](../04-features/first-workflow/spec.md) and [concrete contracts](../04-features/first-workflow/contracts.md) for Proposed request/result shapes, data invariants, validation, concurrency, transfer behavior and acceptance scenarios. Provider SDK/configuration remains subject to verification; these documents do not provision or implement auth.

## Detailed feature matrices

In addition to the first-workflow matrix, implement REF-01 through REF-11 from the [References specification](../04-features/references/spec.md), and DASH-01 through DASH-10 from [Dashboard](../04-features/dashboard/spec.md). Key checks: URL normalization races, cross-account duplicate privacy, stale revisions, no remote fetch on save, partial-dashboard failures and zero provider calls during dashboard load. Destructive reference tests must verify immediate removal after confirmation, with linked notes preserved. These are planned tests, not executed results.

## Detailed grounded-chat baseline

See [AI Chat specification](../04-features/ai-chat/spec.md) and [chat contracts](../04-features/ai-chat/contracts.md) for Proposed source mapping, request/stream/persistence behavior, concurrency/quota reservations and acceptance tests. Online free-API models are current scope; local Ollama/Qwen integration remains future scope. Provider/model, history-retention policies and runtime quality remain unresolved.
