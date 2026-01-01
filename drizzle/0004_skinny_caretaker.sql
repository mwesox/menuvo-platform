CREATE TABLE "service_point_scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_point_id" integer NOT NULL,
	"store_id" integer NOT NULL,
	"scanned_at" timestamp DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip_hash" varchar(64),
	"referrer" text
);
--> statement-breakpoint
CREATE TABLE "service_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100),
	"description" text,
	"attributes" jsonb,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unq_service_points_store_code" UNIQUE("store_id","code")
);
--> statement-breakpoint
ALTER TABLE "service_point_scans" ADD CONSTRAINT "service_point_scans_service_point_id_service_points_id_fk" FOREIGN KEY ("service_point_id") REFERENCES "public"."service_points"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_point_scans" ADD CONSTRAINT "service_point_scans_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_points" ADD CONSTRAINT "service_points_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_scans_service_point" ON "service_point_scans" USING btree ("service_point_id");--> statement-breakpoint
CREATE INDEX "idx_scans_store" ON "service_point_scans" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_scans_date" ON "service_point_scans" USING btree ("scanned_at");--> statement-breakpoint
CREATE INDEX "idx_service_points_store" ON "service_points" USING btree ("store_id");