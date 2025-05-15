ALTER TABLE "private_chat" RENAME COLUMN "sender_id" TO "user_a_id";--> statement-breakpoint
ALTER TABLE "private_chat" RENAME COLUMN "recipient_id" TO "user_b_id";--> statement-breakpoint
ALTER TABLE "private_chat" DROP CONSTRAINT "private_chat_sender_id_chat_user_pk_user_id_fk";
--> statement-breakpoint
ALTER TABLE "private_chat" DROP CONSTRAINT "private_chat_recipient_id_chat_user_pk_user_id_fk";
--> statement-breakpoint
-- Remove the “NOT NULL” on add, backfill existing rows, then enforce NOT NULL
ALTER TABLE "private_chat" ADD COLUMN "unique_chat_key" text;
UPDATE "private_chat"
  SET "unique_chat_key" = /* use generator function: e.g., ObfuscatedChatKey.generate(user_a_id, user_b_id) */;
ALTER TABLE "private_chat" ALTER COLUMN "unique_chat_key" SET NOT NULL;

ALTER TABLE "private_messages" ADD COLUMN "fk_private_chat_unique_key" text;
UPDATE "private_messages" pm
  SET "fk_private_chat_unique_key" = pc.unique_chat_key
  FROM "private_chat" pc
  WHERE pm.fk_private_chat_id = pc.pk_private_chat_id;
ALTER TABLE "private_messages" ALTER COLUMN "fk_private_chat_unique_key" SET NOT NULL;
ALTER TABLE "private_chat" ADD CONSTRAINT "private_chat_user_a_id_chat_user_pk_user_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."chat_user"("pk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_chat" ADD CONSTRAINT "private_chat_user_b_id_chat_user_pk_user_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."chat_user"("pk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- swap the unique constraint and foreign key, then add an index for performance
ALTER TABLE "private_chat"
  ADD CONSTRAINT "private_chat_unique_chat_key_unique"
    UNIQUE("unique_chat_key");

ALTER TABLE "private_messages"
  ADD CONSTRAINT "private_messages_fk_private_chat_unique_key_private_chat_unique_chat_key_fk"
    FOREIGN KEY ("fk_private_chat_unique_key")
    REFERENCES "public"."private_chat"("unique_chat_key")
    ON DELETE cascade
    ON UPDATE no action;

CREATE INDEX idx_private_messages_fk_unique_key
  ON "private_messages"("fk_private_chat_unique_key");