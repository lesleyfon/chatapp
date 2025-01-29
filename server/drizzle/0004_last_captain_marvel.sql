CREATE TABLE "private_messages" (
	"id" integer PRIMARY KEY NOT NULL,
	"fk_private_chat_id" integer NOT NULL,
	"fk_user_id" integer NOT NULL,
	"message_text" text,
	"image_name" text,
	"image_file" "bytea",
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "private_messages" ADD CONSTRAINT "private_messages_fk_private_chat_id_private_chat_pk_private_chat_id_fk" FOREIGN KEY ("fk_private_chat_id") REFERENCES "public"."private_chat"("pk_private_chat_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_messages" ADD CONSTRAINT "private_messages_fk_user_id_chat_user_pk_user_id_fk" FOREIGN KEY ("fk_user_id") REFERENCES "public"."chat_user"("pk_user_id") ON DELETE cascade ON UPDATE no action;