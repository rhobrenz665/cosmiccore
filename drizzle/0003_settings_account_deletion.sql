CREATE TABLE "account_deletion_intents" (
	"owner_id" uuid PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"original_session_hash" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_deletion_jobs" (
	"owner_id" uuid PRIMARY KEY NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"stage" text DEFAULT 'queued' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease" uuid,
	"completed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	CONSTRAINT "account_deletion_jobs_id_unique" UNIQUE("id"),
	CONSTRAINT "account_deletion_jobs_stage_check" CHECK ("account_deletion_jobs"."stage" in ('queued', 'provider_pending', 'complete'))
);
--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "appearance" text DEFAULT 'cosmic' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "color_scheme" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "preferences_revision" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "account_deletion_intents" ADD CONSTRAINT "account_deletion_intents_owner_id_app_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_deletion_jobs" ADD CONSTRAINT "account_deletion_jobs_owner_id_app_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_deletion_intents_expiry_idx" ON "account_deletion_intents" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "account_deletion_jobs_queue_idx" ON "account_deletion_jobs" USING btree ("stage","available_at");--> statement-breakpoint
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_appearance_check" CHECK ("app_users"."appearance" in ('cosmic', 'minimal'));--> statement-breakpoint
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_color_scheme_check" CHECK ("app_users"."color_scheme" in ('light', 'dark', 'system'));--> statement-breakpoint
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_preferences_revision_check" CHECK ("app_users"."preferences_revision" > 0);