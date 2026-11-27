ALTER TABLE "chat_turns" ADD COLUMN "attempt_id" uuid;--> statement-breakpoint
ALTER TABLE "chat_turns" ADD COLUMN "attempt_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chat_turns" ADD COLUMN "attempt_status" text;