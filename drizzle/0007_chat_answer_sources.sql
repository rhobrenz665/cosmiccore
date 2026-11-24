ALTER TABLE "chat_turns" ADD COLUMN "source_kind" text;--> statement-breakpoint
ALTER TABLE "chat_turns" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "chat_turns" ADD COLUMN "source_revision" bigint;