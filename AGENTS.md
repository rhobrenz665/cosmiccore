# CosmicCore working instructions

Current phase: documentation-first planning. Implement the application only after explicit user authorization. During planning, edit documentation only; do not install packages, provision services, create databases, commit, or push.

Read PROJECT_STATUS.md at the start of project work. For scope changes, read docs/01-product/mvp-scope.md. For architectural decisions, read docs/02-architecture/architecture-decisions.md and open-questions.md. For infrastructure or provider claims, consult docs/07-deployment/cost-analysis.md and verify current official documentation.

Keep major unresolved choices Proposed; record assumptions and owner decisions separately. Ask small prioritized groups of questions. Prefer one full-stack Next.js application and minimal dependencies. Protect private user data at every server boundary. Keep AI costs bounded and providers replaceable.

When specifying a feature, cover objective, stories, requirements, workflow, alternative/error/empty states, validation, security, dependencies, API/data implications, acceptance criteria, tests, and MVP/future scope. Leave unresolved details explicit rather than inventing approval.

Finish documentation changes by checking relative links, scope consistency, and Git diff/status. Update PROJECT_STATUS.md with completed work, unresolved decisions, and the smallest next milestone. Preserve unrelated user changes.
