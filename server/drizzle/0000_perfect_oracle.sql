CREATE TABLE "chats" (
	"pk_chats_id" serial PRIMARY KEY NOT NULL,
	"chat_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_user" (
	"pk_user_id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
