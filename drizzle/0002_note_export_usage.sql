CREATE TABLE "note_export_usage" (
	"owner_id" uuid PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"used" integer NOT NULL,
	CONSTRAINT "note_export_usage_used_check" CHECK ("note_export_usage"."used" > 0)
);
--> statement-breakpoint
ALTER TABLE "note_export_usage" ADD CONSTRAINT "note_export_usage_owner_id_app_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;