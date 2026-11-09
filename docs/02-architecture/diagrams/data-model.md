# Conceptual entity relationships

Status: Proposed — not migration DDL

```mermaid
erDiagram
  APP_USERS ||--o{ NOTES : owns
  APP_USERS ||--o{ SAVED_REFERENCES : owns
  APP_USERS ||--o{ COLLECTIONS : owns
  APP_USERS ||--o{ TAGS : owns
  APP_USERS ||--o{ CONVERSATIONS : owns
  COLLECTIONS o|--o{ NOTES : groups
  COLLECTIONS o|--o{ SAVED_REFERENCES : groups
  NOTES ||--o{ NOTE_TAGS : has
  TAGS ||--o{ NOTE_TAGS : labels
  SAVED_REFERENCES ||--o{ REFERENCE_TAGS : has
  TAGS ||--o{ REFERENCE_TAGS : labels
  NOTES o|--o| SOURCE_DOCUMENTS : derives
  SAVED_REFERENCES o|--o| SOURCE_DOCUMENTS : derives
  SOURCE_DOCUMENTS ||--o{ CHUNKS : versions
  CONVERSATIONS ||--o{ MESSAGES : contains
  MESSAGES ||--o{ GENERATION_ATTEMPTS : generates
  MESSAGES ||--o{ MESSAGE_SOURCES : cites
  CHUNKS ||--o{ MESSAGE_SOURCES : supports
  APP_USERS ||--o{ QUOTA_USAGE : consumes
```

Each source document belongs to exactly one note OR reference, never both; enforce an XOR check and unique source foreign keys. Optional ER lines alone do not express this constraint. All relationships must also match owner_id. Auth-managed tables are excluded from application migrations. Historical citation policy must be settled before destructive chunk deletion.
