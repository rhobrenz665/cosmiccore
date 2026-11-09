# Deployment topology

Status: Proposed

```mermaid
flowchart LR
  DEV[Local Next.js + isolated PostgreSQL + optional Ollama]
  GH[GitHub repository / checks] --> PRE[Preview Next.js]
  GH --> MIG[Controlled migration step]
  MIG --> PRODDB[(Production Neon)]
  PRE --> DEVDB[(Isolated development Neon)]
  USER[Public browser] --> PROD[Production Next.js on eligible hosting]
  PROD --> PRODDB
  PROD --> AUTH[Production auth instance]
  PROD --> AI[Approved free AI provider or disabled]
```

Preview must not use production credentials or copied private data. No service has been provisioned. Account-specific quotas, OAuth callbacks and hosting terms must be validated before activation. Local resources are alternatives for development, not production availability guarantees.
