CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"display_name" text NOT NULL,
	"normalized_name" text GENERATED ALWAYS AS (lower(normalize(btrim(display_name), NFC))) STORED NOT NULL,
	CONSTRAINT "collections_owner_id_key" UNIQUE("owner_id","id"),
	CONSTRAINT "collections_name_check" CHECK (char_length("collections"."display_name") between 1 and 60 and "collections"."display_name" = btrim("collections"."display_name"))
);
--> statement-breakpoint
CREATE TABLE "global_quota_usage" (
	"metric" text NOT NULL,
	"window_start" timestamp with time zone DEFAULT '1970-01-01T00:00:00Z'::timestamptz NOT NULL,
	"used" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "global_quota_usage_metric_window_start_pk" PRIMARY KEY("metric","window_start"),
	CONSTRAINT "global_quota_usage_used_check" CHECK ("global_quota_usage"."used" between 0 and 9007199254740991),
	CONSTRAINT "global_quota_usage_metric_check" CHECK ("global_quota_usage"."metric" in ('notes_count', 'notes_bytes', 'references_count', 'references_bytes', 'collections_count', 'tags_count', 'mutations_count'))
);
--> statement-breakpoint
CREATE TABLE "mutation_receipts" (
	"owner_id" uuid NOT NULL,
	"operation" text NOT NULL,
	"mutation_id" uuid NOT NULL,
	"payload_hash" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"revision" bigint,
	"affected_count" integer DEFAULT 0 NOT NULL,
	"result_updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"purge_after" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone DEFAULT now() + interval '24 hours' NOT NULL,
	CONSTRAINT "mutation_receipts_owner_id_operation_mutation_id_pk" PRIMARY KEY("owner_id","operation","mutation_id"),
	CONSTRAINT "mutation_receipts_operation_check" CHECK ("mutation_receipts"."operation" ~ '^[a-z][a-z_]{0,63}$'),
	CONSTRAINT "mutation_receipts_hash_check" CHECK ("mutation_receipts"."payload_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "mutation_receipts_revision_check" CHECK ("mutation_receipts"."revision" is null or "mutation_receipts"."revision" between 1 and 9007199254740991),
	CONSTRAINT "mutation_receipts_count_check" CHECK ("mutation_receipts"."affected_count" >= 0),
	CONSTRAINT "mutation_receipts_expiry_check" CHECK ("mutation_receipts"."expires_at" = "mutation_receipts"."created_at" + interval '24 hours')
);
--> statement-breakpoint
CREATE TABLE "note_references" (
	"owner_id" uuid NOT NULL,
	"note_id" uuid NOT NULL,
	"reference_id" uuid NOT NULL,
	CONSTRAINT "note_references_owner_id_note_id_reference_id_pk" PRIMARY KEY("owner_id","note_id","reference_id")
);
--> statement-breakpoint
CREATE TABLE "note_tags" (
	"owner_id" uuid NOT NULL,
	"note_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "note_tags_owner_id_note_id_tag_id_pk" PRIMARY KEY("owner_id","note_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"collection_id" uuid,
	"title" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"storage_bytes" integer GENERATED ALWAYS AS (octet_length(title) + octet_length(body)) STORED NOT NULL,
	"deleted_at" timestamp with time zone,
	"purge_after" timestamp with time zone,
	CONSTRAINT "notes_owner_id_key" UNIQUE("owner_id","id"),
	CONSTRAINT "notes_title_check" CHECK (char_length("notes"."title") <= 200 and "notes"."title" = btrim("notes"."title")),
	CONSTRAINT "notes_body_size_check" CHECK (octet_length("notes"."body") <= 262144),
	CONSTRAINT "notes_revision_check" CHECK ("notes"."revision" between 1 and 9007199254740991),
	CONSTRAINT "notes_trash_check" CHECK (("notes"."deleted_at" is null and "notes"."purge_after" is null) or ("notes"."deleted_at" is not null and "notes"."purge_after" is not null and "notes"."purge_after" = "notes"."deleted_at" + interval '168 hours'))
);
--> statement-breakpoint
CREATE TABLE "quota_usage" (
	"owner_id" uuid NOT NULL,
	"metric" text NOT NULL,
	"window_start" timestamp with time zone DEFAULT '1970-01-01T00:00:00Z'::timestamptz NOT NULL,
	"used" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quota_usage_owner_id_metric_window_start_pk" PRIMARY KEY("owner_id","metric","window_start"),
	CONSTRAINT "quota_usage_used_check" CHECK ("quota_usage"."used" between 0 and 9007199254740991),
	CONSTRAINT "quota_usage_metric_check" CHECK ("quota_usage"."metric" in ('notes_count', 'notes_bytes', 'references_count', 'references_bytes', 'collections_count', 'tags_count', 'mutations_count'))
);
--> statement-breakpoint
CREATE TABLE "reference_tags" (
	"owner_id" uuid NOT NULL,
	"reference_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "reference_tags_owner_id_reference_id_tag_id_pk" PRIMARY KEY("owner_id","reference_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"collection_id" uuid,
	"url" text NOT NULL,
	"canonical_url_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"revision" bigint DEFAULT 1 NOT NULL,
	"storage_bytes" integer GENERATED ALWAYS AS (octet_length(url) + octet_length(title) + octet_length(description)) STORED NOT NULL,
	CONSTRAINT "references_owner_id_key" UNIQUE("owner_id","id"),
	CONSTRAINT "references_url_check" CHECK (octet_length("references"."url") between 1 and 2048 and "references"."url" ~ '^https?://' and "references"."url" !~ '[[:cntrl:]]'),
	CONSTRAINT "references_url_key_check" CHECK (octet_length("references"."canonical_url_key") between 1 and 2048),
	CONSTRAINT "references_title_check" CHECK (char_length("references"."title") between 1 and 200 and "references"."title" = btrim("references"."title")),
	CONSTRAINT "references_description_check" CHECK (octet_length("references"."description") <= 8192),
	CONSTRAINT "references_revision_check" CHECK ("references"."revision" between 1 and 9007199254740991)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"display_name" text NOT NULL,
	"normalized_name" text GENERATED ALWAYS AS (lower(normalize(btrim(display_name), NFC))) STORED NOT NULL,
	CONSTRAINT "tags_owner_id_key" UNIQUE("owner_id","id"),
	CONSTRAINT "tags_name_check" CHECK (char_length("tags"."display_name") between 1 and 60 and "tags"."display_name" = btrim("tags"."display_name"))
);
--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_owner_id_app_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutation_receipts" ADD CONSTRAINT "mutation_receipts_owner_id_app_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_references" ADD CONSTRAINT "note_references_owner_note_fk" FOREIGN KEY ("owner_id","note_id") REFERENCES "public"."notes"("owner_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_references" ADD CONSTRAINT "note_references_owner_reference_fk" FOREIGN KEY ("owner_id","reference_id") REFERENCES "public"."references"("owner_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_owner_note_fk" FOREIGN KEY ("owner_id","note_id") REFERENCES "public"."notes"("owner_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_owner_tag_fk" FOREIGN KEY ("owner_id","tag_id") REFERENCES "public"."tags"("owner_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_owner_id_app_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_owner_collection_fk" FOREIGN KEY ("owner_id","collection_id") REFERENCES "public"."collections"("owner_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_usage" ADD CONSTRAINT "quota_usage_owner_id_app_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_tags" ADD CONSTRAINT "reference_tags_owner_reference_fk" FOREIGN KEY ("owner_id","reference_id") REFERENCES "public"."references"("owner_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_tags" ADD CONSTRAINT "reference_tags_owner_tag_fk" FOREIGN KEY ("owner_id","tag_id") REFERENCES "public"."tags"("owner_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "references" ADD CONSTRAINT "references_owner_id_app_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "references" ADD CONSTRAINT "references_owner_collection_fk" FOREIGN KEY ("owner_id","collection_id") REFERENCES "public"."collections"("owner_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_owner_id_app_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collections_owner_name_key" ON "collections" USING btree ("owner_id","normalized_name");--> statement-breakpoint
CREATE INDEX "mutation_receipts_expiry_idx" ON "mutation_receipts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "note_references_owner_reference_idx" ON "note_references" USING btree ("owner_id","reference_id","note_id");--> statement-breakpoint
CREATE INDEX "note_tags_owner_tag_idx" ON "note_tags" USING btree ("owner_id","tag_id","note_id");--> statement-breakpoint
CREATE INDEX "notes_owner_recent_idx" ON "notes" USING btree ("owner_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notes_owner_collection_idx" ON "notes" USING btree ("owner_id","collection_id");--> statement-breakpoint
CREATE INDEX "notes_owner_trash_idx" ON "notes" USING btree ("owner_id","deleted_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "notes"."deleted_at" is not null;--> statement-breakpoint
CREATE INDEX "notes_purge_idx" ON "notes" USING btree ("purge_after","id") WHERE "notes"."deleted_at" is not null;--> statement-breakpoint
CREATE INDEX "reference_tags_owner_tag_idx" ON "reference_tags" USING btree ("owner_id","tag_id","reference_id");--> statement-breakpoint
CREATE UNIQUE INDEX "references_owner_url_key" ON "references" USING btree ("owner_id","canonical_url_key");--> statement-breakpoint
CREATE INDEX "references_owner_recent_idx" ON "references" USING btree ("owner_id","updated_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "references_owner_collection_idx" ON "references" USING btree ("owner_id","collection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_owner_name_key" ON "tags" USING btree ("owner_id","normalized_name");