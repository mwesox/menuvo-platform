ALTER TABLE "option_choices" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "option_choices" ADD COLUMN "min_quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "option_choices" ADD COLUMN "max_quantity" integer;--> statement-breakpoint
ALTER TABLE "option_groups" ADD COLUMN "type" text DEFAULT 'multi_select' NOT NULL;--> statement-breakpoint
ALTER TABLE "option_groups" ADD COLUMN "num_free_options" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "option_groups" ADD COLUMN "aggregate_min_quantity" integer;--> statement-breakpoint
ALTER TABLE "option_groups" ADD COLUMN "aggregate_max_quantity" integer;