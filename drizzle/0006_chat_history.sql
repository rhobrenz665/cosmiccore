CREATE TABLE "chat_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_conversations_owner_id_key" UNIQUE("owner_id","id"),
	CONSTRAINT "chat_conversations_title_length" CHECK (char_length("chat_conversations"."title") between 1 and 120)
);
--> statement-breakpoint
CREATE TABLE "chat_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_turns_submission_key" UNIQUE("owner_id","conversation_id","submission_id"),
	CONSTRAINT "chat_turns_question_size" CHECK (octet_length("chat_turns"."question") between 1 and 8192),
	CONSTRAINT "chat_turns_answer_size" CHECK (octet_length("chat_turns"."answer") between 1 and 16384)
);
--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_owner_id_app_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_turns" ADD CONSTRAINT "chat_turns_owner_conversation_fk" FOREIGN KEY ("owner_id","conversation_id") REFERENCES "public"."chat_conversations"("owner_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_conversations_owner_history_idx" ON "chat_conversations" USING btree ("owner_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "chat_turns_history_idx" ON "chat_turns" USING btree ("owner_id","conversation_id","created_at","id");