CREATE TABLE IF NOT EXISTS "private_chat" (
	"pk_private_chat_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "private_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_private_chat_id" text NOT NULL,
	"fk_user_id" text NOT NULL,
	"message_text" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "private_chat" ADD CONSTRAINT "private_chat_sender_id_chat_user_pk_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."chat_user"("pk_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "private_chat" ADD CONSTRAINT "private_chat_recipient_id_chat_user_pk_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."chat_user"("pk_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "private_messages" ADD CONSTRAINT "private_messages_fk_private_chat_id_private_chat_pk_private_chat_id_fk" FOREIGN KEY ("fk_private_chat_id") REFERENCES "public"."private_chat"("pk_private_chat_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "private_messages" ADD CONSTRAINT "private_messages_fk_user_id_chat_user_pk_user_id_fk" FOREIGN KEY ("fk_user_id") REFERENCES "public"."chat_user"("pk_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
