ALTER TABLE "messages" ADD COLUMN "image_name" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "image_file" "bytea";--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "image_url" text;