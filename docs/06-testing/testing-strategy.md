# Testing strategy

Status: Draft

Future implementation: unit tests for validation, chunk/version and quota rules; integration tests against isolated PostgreSQL for ownership, transactions, conflicts and deletion; end-to-end tests for sign-in/capture/search/export/chat. Use two accounts to test IDOR across every record, search, source and conversation path.

AI evaluation: small curated question/source set including irrelevant sources, no-answer cases, injection attempts, stale/deleted notes and citation mismatches. Check retrieval separately from answer quality; use deterministic provider stubs for CI and bounded live checks outside routine tests.

Exercise interrupted streams, provider 429/timeout, retry idempotency, browser reload during save, concurrent editors, quota races and indexing retries. Verify keyboard/mobile and all appearance/color combinations; test reduced motion and contrast. Restore an export/backup into an isolated environment before launch.

Planning verification: check Markdown links and document status/scope consistency. No application test suite is appropriate yet.

## First workflow specification

See [workflow detail](../04-features/first-workflow/spec.md) and [concrete contracts](../04-features/first-workflow/contracts.md) for Proposed request/result shapes, data invariants, validation, concurrency, transfer behavior and acceptance scenarios. Provider SDK/configuration remains subject to verification; these documents do not provision or implement auth.
