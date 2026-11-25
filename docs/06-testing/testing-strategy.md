# Testing strategy

Status: Active — local BUILD-11 checks are recorded; target-host and full release acceptance remain open | Updated: 2026-11-25

Future implementation: unit tests for validation, chunk/version and quota rules; integration tests against isolated PostgreSQL for ownership, transactions, conflicts and deletion; end-to-end tests for sign-in/capture/search/export/chat. Use two accounts to test IDOR across every record, search, source and conversation path.

AI evaluation: small curated question/source set including irrelevant sources, no-answer cases, injection attempts, stale/deleted notes and citation mismatches. Check retrieval separately from answer quality; use deterministic provider stubs for CI and bounded live checks outside routine tests.

Exercise interrupted streams, provider 429/timeout, retry idempotency, browser reload during save, concurrent editors, quota races and indexing retries. Verify keyboard/mobile and all appearance/color combinations; test reduced motion and contrast. Validate Markdown export/import fidelity for MVP. Independent database-backup restore drills belong to the future backup milestone.

## Current local results — 2026-11-25

`node --experimental-strip-types --test scripts/*.test.mts` passed all 22 tests, covering chat evidence/cancellation, connection cleanup, mutation rules, note answers and passage selection, and retrieval chunking. `npm run typecheck`, `npm run lint`, and `npm run build` passed.

Isolated development database checks passed for transaction rollback, owner isolation, blocked-account denial, mutation receipts and races, account/global quota reservations, retrieval ownership/revision behavior, note-answer quota cooldown/daily caps, and BUILD-10 search cases. Signed-in Safari verified successful grounded answers, saved citations, mixed-source retrieval, cooldown feedback, Stop behavior after reload, and direct-link denial for a second account.

Safari also completed a Markdown portability round trip with the synthetic `verify punk` account: exported the saved 548-byte note, imported the `.md` file, and confirmed the imported title and body in the notes list. The imported duplicate was moved to Trash and is recoverable until 2026-12-02; the original fixture remains intact. This verifies one basic local note round trip, not bulk ZIP export, malformed/oversized/invalid UTF-8 handling, metadata fidelity, or cross-account export denial.

The BUILD-10 diagnostic lexical sample returned 0/3 paraphrase matches despite passing its exact/question/no-match assertions. This is not a tested semantic-search capability; decide whether paraphrases are an MVP acceptance requirement before changing retrieval. A BUILD-05 purge rerun safely stopped at its empty-database guard because the acceptance database already contained records; prior clean-database acceptance remains documented in the build plan.

Still unverified: production OAuth/host setup, the full authenticated data-portability matrix, target-host interruption/load behavior, complete accessibility review, account deletion in the provider-backed environment, cleanup scheduling, monitoring and operational recovery. Treat local green checks as local evidence, not production readiness.

## First workflow specification

See [workflow detail](../04-features/first-workflow/spec.md) and [concrete contracts](../04-features/first-workflow/contracts.md) for Proposed request/result shapes, data invariants, validation, concurrency, transfer behavior and acceptance scenarios. Provider SDK/configuration remains subject to verification; these documents do not provision or implement auth.

## Detailed feature matrices

In addition to the first-workflow matrix, implement REF-01 through REF-11 from the [References specification](../04-features/references/spec.md), and DASH-01 through DASH-10 from [Dashboard](../04-features/dashboard/spec.md). Key checks: URL normalization races, cross-account duplicate privacy, stale revisions, no remote fetch on save, partial-dashboard failures and zero provider calls during dashboard load. Destructive reference tests must verify immediate removal after confirmation, with linked notes preserved. These are planned tests, not executed results.

## Detailed grounded-chat baseline

See [AI Chat specification](../04-features/ai-chat/spec.md) and [chat contracts](../04-features/ai-chat/contracts.md) for Proposed source mapping, request/stream/persistence behavior, concurrency/quota reservations and acceptance tests. Online free-API models are current scope; local Ollama/Qwen integration remains future scope. Provider/model, history-retention policies and runtime quality remain unresolved.
