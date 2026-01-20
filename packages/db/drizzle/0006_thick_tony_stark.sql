CREATE TABLE "order_vat_lines"
(
    "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "order_id"       uuid                                       NOT NULL,
    "vat_group_code" varchar(50)                                NOT NULL,
    "vat_group_name" varchar(100)                               NOT NULL,
    "rate"           integer                                    NOT NULL,
    "net_amount"     integer                                    NOT NULL,
    "vat_amount"     integer                                    NOT NULL,
    "gross_amount"   integer                                    NOT NULL,
    "created_at"     timestamp        DEFAULT now()             NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vat_groups"
(
    "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "merchant_id"   uuid                                       NOT NULL,
    "code"          varchar(50)                                NOT NULL,
    "name"          varchar(100)                               NOT NULL,
    "description"   text,
    "rate"          integer          DEFAULT 1900              NOT NULL,
    "display_order" integer          DEFAULT 0                 NOT NULL,
    "created_at"    timestamp        DEFAULT now()             NOT NULL,
    "updated_at"    timestamp        DEFAULT now()             NOT NULL,
    CONSTRAINT "unq_vat_groups_merchant_code" UNIQUE ("merchant_id", "code")
);
--> statement-breakpoint
ALTER TABLE "categories"
    ADD COLUMN "default_vat_group_id" uuid;--> statement-breakpoint
ALTER TABLE "items"
    ADD COLUMN "vat_group_id" uuid;--> statement-breakpoint
ALTER TABLE "option_choices"
    ADD COLUMN "vat_group_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items"
    ADD COLUMN "vat_group_code" varchar(50);--> statement-breakpoint
ALTER TABLE "order_items"
    ADD COLUMN "vat_rate" integer;--> statement-breakpoint
ALTER TABLE "order_items"
    ADD COLUMN "net_price" integer;--> statement-breakpoint
ALTER TABLE "order_items"
    ADD COLUMN "vat_amount" integer;--> statement-breakpoint
ALTER TABLE "orders"
    ADD COLUMN "net_amount" integer;--> statement-breakpoint
ALTER TABLE "orders"
    ADD COLUMN "vat_country_code" varchar(2);--> statement-breakpoint
ALTER TABLE "stores"
    ADD COLUMN "country_code" varchar(2) DEFAULT 'DE' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_vat_lines"
    ADD CONSTRAINT "order_vat_lines_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vat_groups"
    ADD CONSTRAINT "vat_groups_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants" ("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_order_vat_lines_order" ON "order_vat_lines" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_vat_groups_merchant" ON "vat_groups" USING btree ("merchant_id");--> statement-breakpoint
ALTER TABLE "categories"
    ADD CONSTRAINT "categories_default_vat_group_id_vat_groups_id_fk" FOREIGN KEY ("default_vat_group_id") REFERENCES "public"."vat_groups" ("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items"
    ADD CONSTRAINT "items_vat_group_id_vat_groups_id_fk" FOREIGN KEY ("vat_group_id") REFERENCES "public"."vat_groups" ("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_choices"
    ADD CONSTRAINT "option_choices_vat_group_id_vat_groups_id_fk" FOREIGN KEY ("vat_group_id") REFERENCES "public"."vat_groups" ("id") ON DELETE no action ON UPDATE no action;