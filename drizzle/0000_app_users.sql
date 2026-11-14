CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_issuer" text NOT NULL,
	"auth_subject" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_users_status_check" CHECK ("app_users"."status" in ('active', 'deletion_pending', 'blocked'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "app_users_auth_identity_key" ON "app_users" USING btree ("auth_issuer","auth_subject");--> statement-breakpoint
CREATE INDEX "app_users_email_idx" ON "app_users" USING btree ("email");