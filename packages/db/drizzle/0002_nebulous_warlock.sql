DROP TABLE "store_closures" CASCADE;--> statement-breakpoint
DROP TABLE "store_hours" CASCADE;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "hours" jsonb;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "closures" jsonb;