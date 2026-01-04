CREATE TABLE "mollie_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"resource_type" text NOT NULL,
	"merchant_id" integer,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"processing_status" text DEFAULT 'PENDING' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "mollie_customer_id" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "mollie_organization_id" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "mollie_profile_id" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "mollie_access_token" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "mollie_refresh_token" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "mollie_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "mollie_onboarding_status" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "mollie_can_receive_payments" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "mollie_can_receive_settlements" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "mollie_mandate_id" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "mollie_mandate_status" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "mollie_subscription_id" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "mollie_subscription_status" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "payment_provider" text DEFAULT 'stripe';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "mollie_payment_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "mollie_checkout_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_payment_provider" text;--> statement-breakpoint
ALTER TABLE "mollie_events" ADD CONSTRAINT "mollie_events_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mollie_events_type" ON "mollie_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_mollie_events_status" ON "mollie_events" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "idx_mollie_events_resource" ON "mollie_events" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "idx_mollie_events_received" ON "mollie_events" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "idx_mollie_events_merchant" ON "mollie_events" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "idx_orders_mollie_payment" ON "orders" USING btree ("mollie_payment_id");