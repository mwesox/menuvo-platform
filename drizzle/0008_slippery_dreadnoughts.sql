CREATE TABLE "menu_import_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"original_filename" text NOT NULL,
	"file_type" text NOT NULL,
	"file_key" text NOT NULL,
	"status" text DEFAULT 'PROCESSING' NOT NULL,
	"error_message" text,
	"comparison_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchants" ALTER COLUMN "supported_languages" SET DEFAULT ARRAY['de']::text[];--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "owner_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "service_points" ADD COLUMN "zone" varchar(100);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "menu_import_jobs" ADD CONSTRAINT "menu_import_jobs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_menu_import_jobs_store" ON "menu_import_jobs" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_menu_import_jobs_status" ON "menu_import_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_service_points_zone" ON "service_points" USING btree ("store_id","zone");--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "merchants" DROP COLUMN "primary_language";--> statement-breakpoint
ALTER TABLE "option_choices" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "option_groups" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "option_groups" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "service_points" DROP COLUMN "type";