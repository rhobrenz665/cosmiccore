import { sql } from "drizzle-orm";
import {
  bigint, check, foreignKey, index, integer, pgTable, primaryKey,
  text, timestamp, unique, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

export const appUsers = pgTable(
  "app_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authIssuer: text("auth_issuer").notNull(),
    authSubject: text("auth_subject").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    status: text("status").notNull().default("active"),
    appearance: text("appearance", { enum: ["cosmic", "minimal"] }).notNull().default("cosmic"),
    colorScheme: text("color_scheme", { enum: ["light", "dark", "system"] }).notNull().default("system"),
    preferencesRevision: integer("preferences_revision").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("app_users_auth_identity_key").on(table.authIssuer, table.authSubject),
    index("app_users_email_idx").on(table.email),
    check("app_users_appearance_check", sql`${table.appearance} in ('cosmic', 'minimal')`),
    check("app_users_color_scheme_check", sql`${table.colorScheme} in ('light', 'dark', 'system')`),
    check("app_users_preferences_revision_check", sql`${table.preferencesRevision} > 0`),
    check("app_users_status_check", sql`${table.status} in ('active', 'deletion_pending', 'blocked')`),
  ],
);

export type AppUser = typeof appUsers.$inferSelect;

// Keep these builders fresh for each table. Account status and request ownership
// must still be verified by the server; foreign keys do not authorize queries.
const ownedRecord = () => ({
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").notNull().references(() => appUsers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const organizationFields = () => ({
  ...ownedRecord(),
  displayName: text("display_name").notNull(),
  // Computed by PostgreSQL so alternate write paths cannot bypass uniqueness.
  normalizedName: text("normalized_name").notNull()
    .generatedAlwaysAs(sql`lower(normalize(btrim(display_name), NFC))`),
});

export const collections = pgTable("collections", organizationFields(), (t) => [
  unique("collections_owner_id_key").on(t.ownerId, t.id),
  uniqueIndex("collections_owner_name_key").on(t.ownerId, t.normalizedName),
  check("collections_name_check", sql`char_length(${t.displayName}) between 1 and 60 and ${t.displayName} = btrim(${t.displayName})`),
]);

export const tags = pgTable("tags", organizationFields(), (t) => [
  unique("tags_owner_id_key").on(t.ownerId, t.id),
  uniqueIndex("tags_owner_name_key").on(t.ownerId, t.normalizedName),
  check("tags_name_check", sql`char_length(${t.displayName}) between 1 and 60 and ${t.displayName} = btrim(${t.displayName})`),
]);

export const notes = pgTable("notes", {
  ...ownedRecord(),
  collectionId: uuid("collection_id"),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  revision: bigint("revision", { mode: "number" }).notNull().default(1),
  storageBytes: integer("storage_bytes").notNull()
    .generatedAlwaysAs(sql`octet_length(title) + octet_length(body)`),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  purgeAfter: timestamp("purge_after", { withTimezone: true }),
}, (t) => [
  unique("notes_owner_id_key").on(t.ownerId, t.id),
  index("notes_owner_recent_idx").on(t.ownerId, t.updatedAt.desc(), t.id.desc()),
  index("notes_owner_collection_idx").on(t.ownerId, t.collectionId),
  index("notes_owner_trash_idx").on(t.ownerId, t.deletedAt.desc(), t.id.desc()).where(sql`${t.deletedAt} is not null`),
  index("notes_purge_idx").on(t.purgeAfter, t.id).where(sql`${t.deletedAt} is not null`),
  // NO ACTION: the service must unassign and bump revisions before deleting a
  // collection. Composite SET NULL would also clear the non-null owner column.
  foreignKey({ name: "notes_owner_collection_fk", columns: [t.ownerId, t.collectionId], foreignColumns: [collections.ownerId, collections.id] }),
  check("notes_title_check", sql`char_length(${t.title}) <= 200 and ${t.title} = btrim(${t.title})`),
  check("notes_body_size_check", sql`octet_length(${t.body}) <= 262144`),
  check("notes_revision_check", sql`${t.revision} between 1 and 9007199254740991`),
  check("notes_trash_check", sql`(${t.deletedAt} is null and ${t.purgeAfter} is null) or (${t.deletedAt} is not null and ${t.purgeAfter} is not null and ${t.purgeAfter} = ${t.deletedAt} + interval '168 hours')`),
]);

export const references = pgTable("references", {
  ...ownedRecord(),
  collectionId: uuid("collection_id"),
  url: text("url").notNull(),
  canonicalUrlKey: text("canonical_url_key").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  revision: bigint("revision", { mode: "number" }).notNull().default(1),
  storageBytes: integer("storage_bytes").notNull()
    .generatedAlwaysAs(sql`octet_length(url) + octet_length(title) + octet_length(description)`),
}, (t) => [
  unique("references_owner_id_key").on(t.ownerId, t.id),
  uniqueIndex("references_owner_url_key").on(t.ownerId, t.canonicalUrlKey),
  index("references_owner_recent_idx").on(t.ownerId, t.updatedAt.desc(), t.id.desc()),
  index("references_owner_collection_idx").on(t.ownerId, t.collectionId),
  foreignKey({ name: "references_owner_collection_fk", columns: [t.ownerId, t.collectionId], foreignColumns: [collections.ownerId, collections.id] }),
  check("references_url_check", sql`octet_length(${t.url}) between 1 and 2048 and ${t.url} ~ '^https?://' and ${t.url} !~ '[[:cntrl:]]'`),
  check("references_url_key_check", sql`octet_length(${t.canonicalUrlKey}) between 1 and 2048`),
  check("references_title_check", sql`char_length(${t.title}) between 1 and 200 and ${t.title} = btrim(${t.title})`),
  check("references_description_check", sql`octet_length(${t.description}) <= 8192`),
  check("references_revision_check", sql`${t.revision} between 1 and 9007199254740991`),
]);

export const noteTags = pgTable("note_tags", {
  ownerId: uuid("owner_id").notNull(),
  noteId: uuid("note_id").notNull(),
  tagId: uuid("tag_id").notNull(),
}, (t) => [
  primaryKey({ columns: [t.ownerId, t.noteId, t.tagId] }),
  index("note_tags_owner_tag_idx").on(t.ownerId, t.tagId, t.noteId),
  foreignKey({ name: "note_tags_owner_note_fk", columns: [t.ownerId, t.noteId], foreignColumns: [notes.ownerId, notes.id] }).onDelete("cascade"),
  foreignKey({ name: "note_tags_owner_tag_fk", columns: [t.ownerId, t.tagId], foreignColumns: [tags.ownerId, tags.id] }).onDelete("cascade"),
]);

export const referenceTags = pgTable("reference_tags", {
  ownerId: uuid("owner_id").notNull(),
  referenceId: uuid("reference_id").notNull(),
  tagId: uuid("tag_id").notNull(),
}, (t) => [
  primaryKey({ columns: [t.ownerId, t.referenceId, t.tagId] }),
  index("reference_tags_owner_tag_idx").on(t.ownerId, t.tagId, t.referenceId),
  foreignKey({ name: "reference_tags_owner_reference_fk", columns: [t.ownerId, t.referenceId], foreignColumns: [references.ownerId, references.id] }).onDelete("cascade"),
  foreignKey({ name: "reference_tags_owner_tag_fk", columns: [t.ownerId, t.tagId], foreignColumns: [tags.ownerId, tags.id] }).onDelete("cascade"),
]);

export const noteReferences = pgTable("note_references", {
  ownerId: uuid("owner_id").notNull(),
  noteId: uuid("note_id").notNull(),
  referenceId: uuid("reference_id").notNull(),
}, (t) => [
  primaryKey({ columns: [t.ownerId, t.noteId, t.referenceId] }),
  index("note_references_owner_reference_idx").on(t.ownerId, t.referenceId, t.noteId),
  foreignKey({ name: "note_references_owner_note_fk", columns: [t.ownerId, t.noteId], foreignColumns: [notes.ownerId, notes.id] }).onDelete("cascade"),
  foreignKey({ name: "note_references_owner_reference_fk", columns: [t.ownerId, t.referenceId], foreignColumns: [references.ownerId, references.id] }).onDelete("cascade"),
]);

const usageFields = () => ({
  metric: text("metric", { enum: ["notes_count", "notes_bytes", "references_count", "references_bytes", "collections_count", "tags_count", "mutations_count"] }).notNull(),
  // Lifetime storage/count counters use epoch; rate counters use a UTC window.
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().default(sql`'1970-01-01T00:00:00Z'::timestamptz`),
  used: bigint("used", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quotaUsage = pgTable("quota_usage", {
  ownerId: uuid("owner_id").notNull().references(() => appUsers.id, { onDelete: "cascade" }),
  ...usageFields(),
}, (t) => [
  primaryKey({ columns: [t.ownerId, t.metric, t.windowStart] }),
  check("quota_usage_used_check", sql`${t.used} between 0 and 9007199254740991`),
  check("quota_usage_metric_check", sql`${t.metric} in ('notes_count', 'notes_bytes', 'references_count', 'references_bytes', 'collections_count', 'tags_count', 'mutations_count')`),
]);

export const globalQuotaUsage = pgTable("global_quota_usage", usageFields(), (t) => [
  primaryKey({ columns: [t.metric, t.windowStart] }),
  check("global_quota_usage_used_check", sql`${t.used} between 0 and 9007199254740991`),
  check("global_quota_usage_metric_check", sql`${t.metric} in ('notes_count', 'notes_bytes', 'references_count', 'references_bytes', 'collections_count', 'tags_count', 'mutations_count')`),
]);

export const mutationReceipts = pgTable("mutation_receipts", {
  ownerId: uuid("owner_id").notNull().references(() => appUsers.id, { onDelete: "cascade" }),
  operation: text("operation").notNull(),
  mutationId: uuid("mutation_id").notNull(),
  payloadHash: text("payload_hash").notNull(),
  // Success metadata only; no arbitrary JSON/body or FK to a deletable resource.
  entityId: uuid("entity_id").notNull(),
  revision: bigint("revision", { mode: "number" }),
  affectedCount: integer("affected_count").notNull().default(0),
  resultUpdatedAt: timestamp("result_updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  purgeAfter: timestamp("purge_after", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull().default(sql`now() + interval '24 hours'`),
}, (t) => [
  primaryKey({ columns: [t.ownerId, t.operation, t.mutationId] }),
  index("mutation_receipts_expiry_idx").on(t.expiresAt),
  check("mutation_receipts_operation_check", sql`${t.operation} ~ '^[a-z][a-z_]{0,63}$'`),
  check("mutation_receipts_hash_check", sql`${t.payloadHash} ~ '^[0-9a-f]{64}$'`),
  check("mutation_receipts_revision_check", sql`${t.revision} is null or ${t.revision} between 1 and 9007199254740991`),
  check("mutation_receipts_count_check", sql`${t.affectedCount} >= 0`),
  check("mutation_receipts_expiry_check", sql`${t.expiresAt} = ${t.createdAt} + interval '24 hours'`),
]);

// A single rolling-window counter per account, shared by all app instances.
export const noteExportUsage = pgTable("note_export_usage", {
  ownerId: uuid("owner_id").primaryKey().references(() => appUsers.id, { onDelete: "cascade" }),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  used: integer("used").notNull(),
}, (t) => [
  check("note_export_usage_used_check", sql`${t.used} > 0`),
]);

export const accountDeletionIntents = pgTable("account_deletion_intents", {
  ownerId: uuid("owner_id").primaryKey().references(() => appUsers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  originalSessionHash: text("original_session_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (t) => [index("account_deletion_intents_expiry_idx").on(t.expiresAt)]);

export const accountDeletionJobs = pgTable("account_deletion_jobs", {
  ownerId: uuid("owner_id").primaryKey().references(() => appUsers.id, { onDelete: "cascade" }),
  id: uuid("id").notNull().defaultRandom().unique(),
  stage: text("stage", { enum: ["queued", "provider_pending", "complete"] }).notNull().default("queued"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  availableAt: timestamp("available_at", { withTimezone: true }).notNull().defaultNow(),
  lease: uuid("lease"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
}, (t) => [
  index("account_deletion_jobs_queue_idx").on(t.stage, t.availableAt),
  check("account_deletion_jobs_stage_check", sql`${t.stage} in ('queued', 'provider_pending', 'complete')`),
]);

export const retrievalVersions = pgTable("retrieval_versions", {
  ...ownedRecord(),
  noteId: uuid("note_id"),
  referenceId: uuid("reference_id"),
  revision: bigint("revision", { mode: "number" }).notNull(),
  format: integer("format").notNull(),
  hash: text("hash").notNull(),
}, (t) => [
  unique("retrieval_versions_owner_id_key").on(t.ownerId, t.id),
  unique("retrieval_versions_note_key").on(t.ownerId, t.noteId),
  unique("retrieval_versions_reference_key").on(t.ownerId, t.referenceId),
  foreignKey({ name: "retrieval_versions_note_fk", columns: [t.ownerId, t.noteId], foreignColumns: [notes.ownerId, notes.id] }).onDelete("cascade"),
  foreignKey({ name: "retrieval_versions_reference_fk", columns: [t.ownerId, t.referenceId], foreignColumns: [references.ownerId, references.id] }).onDelete("cascade"),
  check("retrieval_versions_one_source", sql`num_nonnulls(${t.noteId}, ${t.referenceId}) = 1`),
  check("retrieval_versions_metadata_check", sql`${t.revision} > 0 and ${t.format} > 0 and ${t.hash} ~ '^[0-9a-f]{64}$'`),
]);

export const retrievalChunks = pgTable("retrieval_chunks", {
  ownerId: uuid("owner_id").notNull(),
  versionId: uuid("version_id").notNull(),
  ordinal: integer("ordinal").notNull(),
  heading: text("heading"),
  start: integer("start_offset").notNull(),
  end: integer("end_offset").notNull(),
  text: text("body").notNull(),
}, (t) => [
  primaryKey({ columns: [t.ownerId, t.versionId, t.ordinal] }),
  foreignKey({ name: "retrieval_chunks_version_fk", columns: [t.ownerId, t.versionId], foreignColumns: [retrievalVersions.ownerId, retrievalVersions.id] }).onDelete("cascade"),
  check("retrieval_chunks_bounds_check", sql`${t.ordinal} between 0 and 511 and ${t.start} >= 0 and ${t.end} >= ${t.start} and ${t.end} - ${t.start} <= 1500`),
]);
