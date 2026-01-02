CREATE TABLE "order_item_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_item_id" integer NOT NULL,
	"option_group_id" integer,
	"option_choice_id" integer,
	"group_name" varchar(200) NOT NULL,
	"choice_name" varchar(200) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_modifier" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"item_id" integer,
	"name" varchar(200) NOT NULL,
	"description" text,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"options_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"display_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"customer_name" varchar(100),
	"customer_email" varchar(255),
	"customer_phone" varchar(50),
	"order_type" text NOT NULL,
	"status" text DEFAULT 'awaiting_payment' NOT NULL,
	"service_point_id" integer,
	"subtotal" integer NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"tip_amount" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(50),
	"stripe_checkout_session_id" varchar(255),
	"stripe_payment_intent_id" varchar(255),
	"customer_notes" text,
	"merchant_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "order_item_options" ADD CONSTRAINT "order_item_options_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_options" ADD CONSTRAINT "order_item_options_option_group_id_option_groups_id_fk" FOREIGN KEY ("option_group_id") REFERENCES "public"."option_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_options" ADD CONSTRAINT "order_item_options_option_choice_id_option_choices_id_fk" FOREIGN KEY ("option_choice_id") REFERENCES "public"."option_choices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_service_point_id_service_points_id_fk" FOREIGN KEY ("service_point_id") REFERENCES "public"."service_points"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_order_item_options_order_item_id" ON "order_item_options" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_store_id" ON "orders" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_payment_status" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_orders_created_at" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_store_status" ON "orders" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "idx_orders_stripe_session" ON "orders" USING btree ("stripe_checkout_session_id");