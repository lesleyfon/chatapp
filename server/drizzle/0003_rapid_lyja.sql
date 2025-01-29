CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_chat_id" integer NOT NULL,
	"fk_user_id" integer NOT NULL,
	"message_text" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_fk_chat_id_chats_pk_chats_id_fk" FOREIGN KEY ("fk_chat_id") REFERENCES "public"."chats"("pk_chats_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_fk_user_id_chat_user_pk_user_id_fk" FOREIGN KEY ("fk_user_id") REFERENCES "public"."chat_user"("pk_user_id") ON DELETE cascade ON UPDATE no action;