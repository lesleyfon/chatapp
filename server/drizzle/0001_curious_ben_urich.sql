CREATE TABLE "private_chat" (
	"pk_private_chat_id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "private_chat" ADD CONSTRAINT "private_chat_sender_id_chat_user_pk_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."chat_user"("pk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_chat" ADD CONSTRAINT "private_chat_recipient_id_chat_user_pk_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."chat_user"("pk_user_id") ON DELETE cascade ON UPDATE no action;