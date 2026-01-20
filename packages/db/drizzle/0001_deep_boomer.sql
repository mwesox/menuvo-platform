CREATE TABLE "store_counters"
(
    "store_id"      uuid PRIMARY KEY        NOT NULL,
    "pickup_number" integer   DEFAULT 0     NOT NULL,
    "updated_at"    timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders"
    ADD COLUMN "pickup_number" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "store_counters"
    ADD CONSTRAINT "store_counters_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_orders_store_pickup" ON "orders" USING btree ("store_id","pickup_number");