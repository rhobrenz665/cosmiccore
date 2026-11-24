CREATE TABLE "retrieval_chunks" (
	"owner_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"heading" text,
	"start_offset" integer NOT NULL,
	"end_offset" integer NOT NULL,
	"body" text NOT NULL,
	CONSTRAINT "retrieval_chunks_owner_id_version_id_ordinal_pk" PRIMARY KEY("owner_id","version_id","ordinal"),
	CONSTRAINT "retrieval_chunks_bounds_check" CHECK ("retrieval_chunks"."ordinal" between 0 and 511 and "retrieval_chunks"."start_offset" >= 0 and "retrieval_chunks"."end_offset" >= "retrieval_chunks"."start_offset" and "retrieval_chunks"."end_offset" - "retrieval_chunks"."start_offset" <= 1500)
);
--> statement-breakpoint
CREATE TABLE "retrieval_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note_id" uuid,
	"reference_id" uuid,
	"revision" bigint NOT NULL,
	"format" integer NOT NULL,
	"hash" text NOT NULL,
	CONSTRAINT "retrieval_versions_owner_id_key" UNIQUE("owner_id","id"),
	CONSTRAINT "retrieval_versions_note_key" UNIQUE("owner_id","note_id"),
	CONSTRAINT "retrieval_versions_reference_key" UNIQUE("owner_id","reference_id"),
	CONSTRAINT "retrieval_versions_one_source" CHECK (num_nonnulls("retrieval_versions"."note_id", "retrieval_versions"."reference_id") = 1),
	CONSTRAINT "retrieval_versions_metadata_check" CHECK ("retrieval_versions"."revision" > 0 and "retrieval_versions"."format" > 0 and "retrieval_versions"."hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "retrieval_chunks" ADD CONSTRAINT "retrieval_chunks_version_fk" FOREIGN KEY ("owner_id","version_id") REFERENCES "public"."retrieval_versions"("owner_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_versions" ADD CONSTRAINT "retrieval_versions_owner_id_app_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_versions" ADD CONSTRAINT "retrieval_versions_note_fk" FOREIGN KEY ("owner_id","note_id") REFERENCES "public"."notes"("owner_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrieval_versions" ADD CONSTRAINT "retrieval_versions_reference_fk" FOREIGN KEY ("owner_id","reference_id") REFERENCES "public"."references"("owner_id","id") ON DELETE cascade ON UPDATE no action;