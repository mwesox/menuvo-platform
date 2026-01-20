ALTER TABLE "orders"
    ADD COLUMN "idempotency_key" varchar(36);--> statement-breakpoint
ALTER TABLE "orders"
    ADD CONSTRAINT "idx_orders_idempotency_key" UNIQUE ("idempotency_key");