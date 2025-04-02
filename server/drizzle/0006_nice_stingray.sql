ALTER TABLE "chat_members" ALTER COLUMN "added_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "sent_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "private_chat" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "private_messages" ALTER COLUMN "sent_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chat_user" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chat_user" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chat_members" ADD COLUMN "timezone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "timezone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "timezone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "private_chat" ADD COLUMN "timezone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "private_messages" ADD COLUMN "timezone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_user" ADD COLUMN "timezone" text NOT NULL;