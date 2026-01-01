CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"api_version" text,
	"stripe_created_at" timestamp NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"processing_status" text DEFAULT 'PENDING' NOT NULL,
	"stripe_account_id" text,
	"object_id" text,
	"object_type" text,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "payment_account_id" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "payment_onboarding_complete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "payment_capabilities_status" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "payment_requirements_status" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "subscription_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "subscription_id" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "subscription_price_id" text;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "subscription_trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "subscription_current_period_end" timestamp;--> statement-breakpoint
CREATE INDEX "idx_stripe_events_type" ON "stripe_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_stripe_events_status" ON "stripe_events" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "idx_stripe_events_account" ON "stripe_events" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "idx_stripe_events_received" ON "stripe_events" USING btree ("received_at");