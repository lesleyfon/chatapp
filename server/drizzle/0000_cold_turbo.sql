CREATE TABLE IF NOT EXISTS "chat_members" (
	"id" uuid DEFAULT gen_random_uuid(),
	"fk_chat_id" text NOT NULL,
	"fk_user_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chats" (
	"pk_chats_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"fk_chat_id" text NOT NULL,
	"fk_user_id" text NOT NULL,
	"message_text" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_user" (
	"pk_user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_fk_chat_id_chats_pk_chats_id_fk" FOREIGN KEY ("fk_chat_id") REFERENCES "public"."chats"("pk_chats_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_fk_user_id_chat_user_pk_user_id_fk" FOREIGN KEY ("fk_user_id") REFERENCES "public"."chat_user"("pk_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_fk_chat_id_chats_pk_chats_id_fk" FOREIGN KEY ("fk_chat_id") REFERENCES "public"."chats"("pk_chats_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_fk_user_id_chat_user_pk_user_id_fk" FOREIGN KEY ("fk_user_id") REFERENCES "public"."chat_user"("pk_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
