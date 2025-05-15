ALTER TABLE "private_chat" RENAME COLUMN "sender_id" TO "user_a_id";--> statement-breakpoint
ALTER TABLE "private_chat" RENAME COLUMN "recipient_id" TO "user_b_id";--> statement-breakpoint
ALTER TABLE "private_chat" DROP CONSTRAINT "private_chat_sender_id_chat_user_pk_user_id_fk";
--> statement-breakpoint
ALTER TABLE "private_chat" DROP CONSTRAINT "private_chat_recipient_id_chat_user_pk_user_id_fk";
--> statement-breakpoint
ALTER TABLE "private_chat" ADD COLUMN "unique_chat_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "private_messages" ADD COLUMN "fk_private_chat_unique_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "private_chat" ADD CONSTRAINT "private_chat_user_a_id_chat_user_pk_user_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."chat_user"("pk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_chat" ADD CONSTRAINT "private_chat_user_b_id_chat_user_pk_user_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."chat_user"("pk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_messages" ADD CONSTRAINT "private_messages_fk_private_chat_unique_key_private_chat_unique_chat_key_fk" FOREIGN KEY ("fk_private_chat_unique_key") REFERENCES "public"."private_chat"("unique_chat_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_chat" ADD CONSTRAINT "private_chat_unique_chat_key_unique" UNIQUE("unique_chat_key");