CREATE TABLE "store_settings" (
	"store_id" uuid PRIMARY KEY NOT NULL,
	"order_types" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_orders_store_completed_at" ON "orders" USING btree ("store_id","completed_at");--> statement-breakpoint
CREATE INDEX "idx_orders_store_status_created" ON "orders" USING btree ("store_id","status","created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_store_created_at" ON "orders" USING btree ("store_id","created_at");