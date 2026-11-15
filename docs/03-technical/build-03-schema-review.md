# BUILD-03 Step 2 — schema review

Status: Owner applied development migration; tables and migration hash verified read-only | Date: 2026-11-15

Owner authorized Step 2 and subsequently ran Step 3 manually. Read-only verification found all ten new tables and two migration records, including a SHA-256 hash matching the local 0001 SQL. Owner subsequently approved beginning Step 4; [transaction support](build-03-transactions.md) passed the owner's manual check, followed by approved [ownership checks](build-03-ownership.md). Further parts pause for the owner's approval. Existing [workflow contracts](../04-features/first-workflow/contracts.md) and [reference specification](../04-features/references/spec.md) remain the behavior baseline.

## Migration contents

Source: [Drizzle schema](../../src/lib/db/schema.ts). Generated artifact: [0001_knowledge_storage.sql](../../drizzle/0001_knowledge_storage.sql).

| Tables | Purpose and database guarantees |
|---|---|
| collections, tags | Private names; generated NFC/lowercase identity unique per owner and kind |
| notes | Markdown, optional collection, positive safe-integer revision, computed content bytes, paired seven-day Trash timestamps |
| references | Saved URL, canonical duplicate key unique per owner, description, revision, computed content bytes; no Trash |
| note_tags, reference_tags, note_references | Composite owner-matched foreign keys and duplicate-free association keys |
| quota_usage, global_quota_usage | Nonnegative safe-integer counters for count, byte and mutation metrics; global rows have no account owner |
| mutation_receipts | Unique owner/operation/mutation ID, payload SHA-256 fingerprint, bounded success metadata, 24-hour expiry |

Ten new application tables. No changes to app_users or provider-managed authentication tables, no data rewrites, extensions, roles, seeds or grants. Referenced owner/id uniqueness uses table constraints so it exists before foreign keys are added. Generated expressions require a UTF-8 PostgreSQL database. The owner applied the migration; database behavior and concurrency tests remain pending.

## Boundaries for the next steps

- Foreign keys prevent cross-owner associations; they do not filter reads or authorize writes. No new endpoint exposes these tables. Verified sessions, active-account locking, scoped queries and CSRF checks remain service responsibilities. RLS is not implemented or claimed.
- Collection foreign keys use NO ACTION. A deletion service must clear assignments and increment affected item revisions in the same transaction before deleting the collection. Tag/link cascades remove associations; services must increment affected item revisions. Account cleanup must settle global usage before removing private rows.
- PostgreSQL generates normalized organization names using lower(normalize(btrim(display_name), NFC)); this defines database-locale lowercase identity, not full Unicode case folding. Services must trim Unicode whitespace, normalize display names to NFC and use the database-generated key for duplicate detection. Test composed/decomposed Unicode and case duplicates.
- Database checks enforce title/name/body/URL/description size bounds from the existing proposals. Full URL parsing, credentials/hostname validation and fragment-free canonicalization remain server responsibilities; the URL SQL check is only a coarse safeguard. No destination fetch is introduced.
- Counters support lifetime totals using the UTC epoch window and rate counts using UTC time windows. Services must choose canonical windows, lock global then account counters in a consistent order, and commit content/counters/receipts together. These tables alone do not enforce quota ceilings or maintain totals. No global capacity number is invented. Public activation remains gated on configured global ceilings.
- Trash still counts toward note totals/storage. Purge releases counters once; restoring does not reserve another note. Trashed/expired notes cannot receive new associations through services. Physical purge execution belongs to BUILD-05.
- Receipts contain identifiers, revision/count and timestamps only; no note bodies, URLs, display names or arbitrary JSON. They intentionally have no resource foreign key so a delete can retain its success receipt. [Step 4c](build-03-mutations.md) implements replay authorization, lifecycle and logical expiry, pending the owner's database check; organization display metadata must be reconstructed only from an authorized current resource. Physical cleanup remains unresolved.
- Chat, source indexing, embeddings, preferences, search indexes, UI, transaction driver changes and cleanup workers are outside Step 2.

## Review and manual handoff

Local checks: migration generation, TypeScript, lint and production build. SQL review checks additive statements, referenced-key ordering, owner-matched links and unchanged identity schema. Actual database constraint, rollback, race and cleanup tests remain pending; successful generation is not runtime validation.

After the owner approves Step 3, run `npm run db:migrate` from the repository using the existing development environment. The migration configuration uses DATABASE_URL_UNPOOLED. Confirm the environment targets the intended development database without sharing the connection string. Use Drizzle migrations, not manual SQL pasting or schema push. Stop on error and share redacted output; do not reset the database or retry by deleting migration history.

After application, verify the ten new tables and the second migration journal entry before approving Step 4. Preserve the existing app_users data. No commit, push or production migration is part of this handoff.

Implementation reference: [Drizzle constraints](https://orm.drizzle.team/docs/indexes-constraints) and [generated columns](https://orm.drizzle.team/docs/generated-columns), checked 2026-11-15 against the installed API declarations.
