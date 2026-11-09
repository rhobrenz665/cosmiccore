# Components and trust boundaries

Status: Proposed

```mermaid
flowchart TB
  subgraph Untrusted[Untrusted client]
    B[Browser editor / search / chat]
  end
  G[Google identity] --> A[Neon managed Better Auth - proposed]
  B <--> A
  subgraph App[Next.js server boundary]
    E[Server Components / Actions / Route Handlers]
    V[Session verification / validation / quotas]
    S[Notes / knowledge / reference / chat services]
    R[Owner-scoped data access]
    AI[AI adapter / context assembly]
    E --> V --> S
    S --> R
    S --> AI
  end
  B <--> E
  A --> V
  R --> DB[(Neon PostgreSQL)]
  AI --> Q[Selected external AI provider - unresolved]
  A --> DB
```

Auth integration is proposed; the application never trusts browser-supplied ownership. Provider transmission includes only bounded authorized context under the chosen privacy policy. No MCP/tool executor or separate backend is present.
