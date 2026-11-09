# Notes

Status: Draft — initial specification placeholder

Objective: Capture and recover Markdown knowledge reliably.

Confirmed choices: Markdown editor with preview, individual `.md` import/export and bulk Markdown export.

Proposed remaining scope: CRUD, autosave, conflict feedback and links. Rich-text editing and PDF/Word imports are deferred.

Next specification work: Specify size limits, debounce policy, import validation and conflict recovery.

Before implementation, complete user stories, functional/nonfunctional requirements, main and alternative workflows, loading/error/empty states, validation, security, dependencies, API/data implications, testable acceptance criteria and test scenarios. All data access is owner-scoped; provider failures must not corrupt saved knowledge. See [MVP scope](../../01-product/mvp-scope.md) for authoritative release boundaries.

## Confirmed note recovery decisions — 2026-11-10

7-day private Trash with immediate exclusion from normal lists/search/AI retrieval; owner can restore before expiry. Major-failure recovery target: at most 24 hours of lost changes. The backup mechanism is unverified under $0; RTO and backup/account/history retention remain unresolved. See [retention and recovery policy](../../07-deployment/data-retention-and-recovery.md).

## First workflow expansion

The [first workflow specification](../first-workflow/spec.md) and [contracts](../first-workflow/contracts.md) now provide detailed Proposed behavior, limits, errors, security and acceptance tests for this feature within the initial notes-only slice. Earlier placeholder text is superseded for that slice. References and AI workflows require their own detailed specifications.
