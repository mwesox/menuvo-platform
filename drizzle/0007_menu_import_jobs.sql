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
ALTER TABLE "menu_import_jobs" ADD CONSTRAINT "menu_import_jobs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_menu_import_jobs_store_id" ON "menu_import_jobs" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_menu_import_jobs_status" ON "menu_import_jobs" USING btree ("status");
