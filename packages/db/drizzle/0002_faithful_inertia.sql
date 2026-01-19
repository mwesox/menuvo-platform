ALTER TABLE "orders"
    ADD COLUMN "merchant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "orders"
    ADD CONSTRAINT "orders_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants" ("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_orders_merchant_id" ON "orders" USING btree ("merchant_id");