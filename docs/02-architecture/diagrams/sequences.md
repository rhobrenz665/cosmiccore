# Sequence diagrams

Status: Draft

## Autosave

```mermaid
sequenceDiagram
  participant C as Editor
  participant S as Next.js service
  participant D as PostgreSQL
  C->>S: save(noteId, expectedRevision, text)
  S->>S: Verify session, owner and input
  S->>D: Transaction: conditional update + index invalidation
  alt Revision matches and owned note exists
    D-->>S: New revision committed
    S-->>C: Saved revision
  else Stale revision or missing/deleted record
    D-->>S: No matching update
    S-->>C: Authorized conflict or generic unavailable
    C->>C: Preserve local edits; show resolution
  end
```

## Grounded chat

```mermaid
sequenceDiagram
  participant C as Chat client
  participant S as Chat service
  participant D as PostgreSQL
  participant P as AI provider
  C->>S: Question + conversation + idempotency key
  S->>S: Verify session/ownership/input
  S->>D: Atomically reserve quota and record attempt
  S->>D: Retrieve own current source chunks
  alt Evidence available and provider permitted
    S->>P: Bounded context and prompt
    P-->>S: Stream answer
    S-->>C: Content + server-mapped source events
    S->>D: Finalize message, sources and usage
    S-->>C: Persisted completion event
  else No evidence / failure / quota exhausted
    S->>D: Record attempt outcome and reconcile reservation
    S-->>C: Explicit no-evidence or retryable failure state
  end
```

A terminated invocation may not execute cleanup: a later request must reconcile expired attempt leases conservatively. Completion is emitted only after final persistence; disconnected clients can reload attempt state.
