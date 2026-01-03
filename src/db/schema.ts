import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
	varchar,
} from "drizzle-orm/pg-core";

// ============================================================================
// TRANSLATION TYPES
// ============================================================================

/**
 * Translation structure for entities with name and description fields.
 * Used for categories, items, and option groups.
 */
export type EntityTranslations = Record<
	string,
	{ name?: string; description?: string }
>;

/**
 * Translation structure for entities with only a name field.
 * Used for option choices.
 */
export type ChoiceTranslations = Record<string, { name?: string }>;

// ============================================================================
// STRIPE ENUMS
// ============================================================================

/**
 * Payment capabilities status from Stripe Connect.
 * - active: Can process payments
 * - pending: Awaiting verification/requirements
 * - inactive: Cannot process payments
 */
export const paymentCapabilitiesStatus = [
	"active",
	"pending",
	"inactive",
] as const;
export type PaymentCapabilitiesStatus =
	(typeof paymentCapabilitiesStatus)[number];

/**
 * Payment requirements status from Stripe Connect.
 * - none: No outstanding requirements
 * - currently_due: Requirements need to be submitted soon
 * - past_due: Requirements overdue, may affect payouts
 * - pending_verification: Requirements submitted, awaiting review
 */
export const paymentRequirementsStatus = [
	"none",
	"currently_due",
	"past_due",
	"pending_verification",
] as const;
export type PaymentRequirementsStatus =
	(typeof paymentRequirementsStatus)[number];

/**
 * Subscription status from Stripe.
 * - none: No subscription
 * - trialing: In trial period (30 days)
 * - active: Subscription is active and paid
 * - paused: Trial ended without payment method
 * - past_due: Payment failed
 * - canceled: Subscription was canceled
 */
export const subscriptionStatus = [
	"none",
	"trialing",
	"active",
	"paused",
	"past_due",
	"canceled",
] as const;
export type SubscriptionStatus = (typeof subscriptionStatus)[number];

/**
 * Processing status for Stripe webhook events.
 * - PENDING: Event received, not yet processed
 * - PROCESSED: Successfully handled
 * - FAILED: Processing failed (will not retry automatically)
 */
export const processingStatus = ["PENDING", "PROCESSED", "FAILED"] as const;
export type ProcessingStatus = (typeof processingStatus)[number];

// ============================================================================
// ORDER ENUMS
// ============================================================================

/**
 * Order status enum (fulfillment workflow).
 * - awaiting_payment: Order created, waiting for Stripe payment
 * - confirmed: Payment confirmed OR pay-at-counter, ready for kitchen
 * - preparing: Kitchen working on it
 * - ready: Ready for pickup
 * - completed: Handed to customer
 * - cancelled: Cancelled (by customer, merchant, or payment failed)
 */
export const orderStatuses = [
	"awaiting_payment",
	"confirmed",
	"preparing",
	"ready",
	"completed",
	"cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

/**
 * Payment status enum.
 * - pending: Initial state before payment action
 * - awaiting_confirmation: Sent to Stripe Checkout, waiting for webhook
 * - paid: Payment confirmed via Stripe webhook
 * - pay_at_counter: Dine-in, will pay after eating
 * - failed: Payment failed
 * - refunded: Refunded (full or partial)
 * - expired: Stripe Checkout session expired
 */
export const paymentStatuses = [
	"pending",
	"awaiting_confirmation",
	"paid",
	"pay_at_counter",
	"failed",
	"refunded",
	"expired",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

/**
 * Order type enum.
 * - dine_in: Eating at the restaurant
 * - takeaway: Pickup
 * - delivery: Future: delivery
 */
export const orderTypes = ["dine_in", "takeaway", "delivery"] as const;
export type OrderType = (typeof orderTypes)[number];

// ============================================================================
// MERCHANTS
// ============================================================================

export const merchants = pgTable("merchants", {
	id: serial().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	ownerName: varchar("owner_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull().unique(),
	phone: varchar({ length: 50 }),
	// Supported languages for menu translations (first is used as fallback)
	supportedLanguages: text("supported_languages")
		.array()
		.notNull()
		.default(sql`ARRAY['de']::text[]`),
	// Stripe Connect (Payment provider integration)
	paymentAccountId: text("payment_account_id"),
	paymentOnboardingComplete: boolean("payment_onboarding_complete")
		.default(false)
		.notNull(),
	paymentCapabilitiesStatus: text("payment_capabilities_status", {
		enum: paymentCapabilitiesStatus,
	}),
	paymentRequirementsStatus: text("payment_requirements_status", {
		enum: paymentRequirementsStatus,
	}),
	// Subscription fields
	subscriptionStatus: text("subscription_status", {
		enum: subscriptionStatus,
	})
		.default("none")
		.notNull(),
	subscriptionId: text("subscription_id"),
	subscriptionPriceId: text("subscription_price_id"),
	subscriptionTrialEndsAt: timestamp("subscription_trial_ends_at"),
	subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const merchantsRelations = relations(merchants, ({ many }) => ({
	stores: many(stores),
	images: many(images),
}));

// ============================================================================
// STORES
// ============================================================================

export const stores = pgTable("stores", {
	id: serial().primaryKey(),
	merchantId: integer("merchant_id")
		.notNull()
		.references(() => merchants.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull().unique(),
	// Address fields
	street: varchar({ length: 255 }),
	city: varchar({ length: 100 }),
	postalCode: varchar("postal_code", { length: 20 }),
	country: varchar({ length: 100 }),
	// Contact
	phone: varchar({ length: 50 }),
	email: varchar({ length: 255 }),
	// Images (S3 URLs)
	logoUrl: text("logo_url"),
	// Settings
	timezone: varchar({ length: 50 }).notNull().default("UTC"),
	currency: varchar({ length: 3 }).notNull().default("EUR"),
	// Status
	isActive: boolean("is_active").notNull().default(true),
	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const storesRelations = relations(stores, ({ one, many }) => ({
	merchant: one(merchants, {
		fields: [stores.merchantId],
		references: [merchants.id],
	}),
	categories: many(categories),
	items: many(items),
	optionGroups: many(optionGroups),
	hours: many(storeHours),
	closures: many(storeClosures),
	servicePoints: many(servicePoints),
	orders: many(orders),
}));

// ============================================================================
// STORE HOURS
// ============================================================================

export const daysOfWeek = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
] as const;
export type DayOfWeek = (typeof daysOfWeek)[number];

export const storeHours = pgTable(
	"store_hours",
	{
		id: serial().primaryKey(),
		storeId: integer("store_id")
			.notNull()
			.references(() => stores.id, { onDelete: "cascade" }),
		dayOfWeek: text("day_of_week", { enum: daysOfWeek }).notNull(),
		openTime: varchar("open_time", { length: 5 }).notNull(), // HH:MM
		closeTime: varchar("close_time", { length: 5 }).notNull(), // HH:MM
		displayOrder: integer("display_order").notNull().default(0),
		// Timestamps
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("idx_store_hours_store").on(table.storeId)],
);

export const storeHoursRelations = relations(storeHours, ({ one }) => ({
	store: one(stores, {
		fields: [storeHours.storeId],
		references: [stores.id],
	}),
}));

// ============================================================================
// STORE CLOSURES
// ============================================================================

export const storeClosures = pgTable(
	"store_closures",
	{
		id: serial().primaryKey(),
		storeId: integer("store_id")
			.notNull()
			.references(() => stores.id, { onDelete: "cascade" }),
		startDate: varchar("start_date", { length: 10 }).notNull(), // YYYY-MM-DD
		endDate: varchar("end_date", { length: 10 }).notNull(), // YYYY-MM-DD
		reason: varchar("reason", { length: 255 }),
		// Timestamps
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("idx_store_closures_store").on(table.storeId)],
);

export const storeClosuresRelations = relations(storeClosures, ({ one }) => ({
	store: one(stores, {
		fields: [storeClosures.storeId],
		references: [stores.id],
	}),
}));

// ============================================================================
// CATEGORIES
// ============================================================================

export const categories = pgTable("categories", {
	id: serial().primaryKey(),
	storeId: integer("store_id")
		.notNull()
		.references(() => stores.id, { onDelete: "cascade" }),
	displayOrder: integer("display_order").notNull().default(0),
	isActive: boolean("is_active").notNull().default(true),
	// All translations stored uniformly: {"de": {name, description}, "en": {...}}
	translations: jsonb("translations")
		.$type<EntityTranslations>()
		.notNull()
		.default(sql`'{}'::jsonb`),
	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
	store: one(stores, {
		fields: [categories.storeId],
		references: [stores.id],
	}),
	items: many(items),
}));

// ============================================================================
// ITEMS
// ============================================================================

export const items = pgTable("items", {
	id: serial().primaryKey(),
	categoryId: integer("category_id")
		.notNull()
		.references(() => categories.id, { onDelete: "cascade" }),
	storeId: integer("store_id")
		.notNull()
		.references(() => stores.id, { onDelete: "cascade" }),
	price: integer().notNull(), // Price in cents
	imageUrl: varchar("image_url", { length: 500 }),
	allergens: text().array(), // PostgreSQL text array for allergens
	displayOrder: integer("display_order").notNull().default(0),
	isAvailable: boolean("is_available").notNull().default(true),
	// All translations stored uniformly: {"de": {name, description}, "en": {...}}
	translations: jsonb("translations")
		.$type<EntityTranslations>()
		.notNull()
		.default(sql`'{}'::jsonb`),
	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const itemsRelations = relations(items, ({ one, many }) => ({
	category: one(categories, {
		fields: [items.categoryId],
		references: [categories.id],
	}),
	store: one(stores, {
		fields: [items.storeId],
		references: [stores.id],
	}),
	itemOptionGroups: many(itemOptionGroups),
}));

// ============================================================================
// OPTION GROUP ENUMS
// ============================================================================

/**
 * Option group types for menu item customization.
 * - single_select: Radio buttons, customer must choose exactly one (e.g., Size)
 * - multi_select: Checkboxes, customer can choose 0 to N (e.g., Toppings)
 * - quantity_select: Quantity pickers, customer picks quantities (e.g., "Pick 3 donuts")
 */
export const optionGroupTypes = [
	"single_select",
	"multi_select",
	"quantity_select",
] as const;
export type OptionGroupType = (typeof optionGroupTypes)[number];

// ============================================================================
// OPTION GROUPS
// ============================================================================

export const optionGroups = pgTable("option_groups", {
	id: serial().primaryKey(),
	storeId: integer("store_id")
		.notNull()
		.references(() => stores.id, { onDelete: "cascade" }),
	// Option group type (determines UI rendering)
	type: text("type", { enum: optionGroupTypes })
		.notNull()
		.default("multi_select"),
	isRequired: boolean("is_required").notNull().default(false),
	minSelections: integer("min_selections").notNull().default(0),
	maxSelections: integer("max_selections"), // null = unlimited
	// Free options (e.g., "first 2 toppings free, extras cost extra")
	numFreeOptions: integer("num_free_options").notNull().default(0),
	// Aggregate quantity constraints (for quantity_select type)
	aggregateMinQuantity: integer("aggregate_min_quantity"), // null = no min
	aggregateMaxQuantity: integer("aggregate_max_quantity"), // null = no max
	displayOrder: integer("display_order").notNull().default(0),
	isActive: boolean("is_active").notNull().default(true),
	// All translations stored uniformly: {"de": {name, description}, "en": {...}}
	translations: jsonb("translations")
		.$type<EntityTranslations>()
		.notNull()
		.default(sql`'{}'::jsonb`),
	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const optionGroupsRelations = relations(
	optionGroups,
	({ one, many }) => ({
		store: one(stores, {
			fields: [optionGroups.storeId],
			references: [stores.id],
		}),
		optionChoices: many(optionChoices),
		itemOptionGroups: many(itemOptionGroups),
	}),
);

// ============================================================================
// OPTION CHOICES
// ============================================================================

export const optionChoices = pgTable("option_choices", {
	id: serial().primaryKey(),
	optionGroupId: integer("option_group_id")
		.notNull()
		.references(() => optionGroups.id, { onDelete: "cascade" }),
	priceModifier: integer("price_modifier").notNull().default(0), // In cents, can be positive/negative
	displayOrder: integer("display_order").notNull().default(0),
	isAvailable: boolean("is_available").notNull().default(true),
	// Pre-selected by default (reduces customer clicks for common options)
	isDefault: boolean("is_default").notNull().default(false),
	// Per-choice quantity limits (for quantity_select type)
	minQuantity: integer("min_quantity").notNull().default(0), // Min qty customer can select
	maxQuantity: integer("max_quantity"), // Max qty per choice, null = unlimited
	// All translations stored uniformly: {"de": {name}, "en": {...}}
	translations: jsonb("translations")
		.$type<ChoiceTranslations>()
		.notNull()
		.default(sql`'{}'::jsonb`),
	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const optionChoicesRelations = relations(optionChoices, ({ one }) => ({
	optionGroup: one(optionGroups, {
		fields: [optionChoices.optionGroupId],
		references: [optionGroups.id],
	}),
}));

// ============================================================================
// ITEM OPTION GROUPS (Junction Table)
// ============================================================================

export const itemOptionGroups = pgTable("item_option_groups", {
	id: serial().primaryKey(),
	itemId: integer("item_id")
		.notNull()
		.references(() => items.id, { onDelete: "cascade" }),
	optionGroupId: integer("option_group_id")
		.notNull()
		.references(() => optionGroups.id, { onDelete: "cascade" }),
	displayOrder: integer("display_order").notNull().default(0),
	// Timestamp
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const itemOptionGroupsRelations = relations(
	itemOptionGroups,
	({ one }) => ({
		item: one(items, {
			fields: [itemOptionGroups.itemId],
			references: [items.id],
		}),
		optionGroup: one(optionGroups, {
			fields: [itemOptionGroups.optionGroupId],
			references: [optionGroups.id],
		}),
	}),
);

// ============================================================================
// STRIPE EVENTS
// ============================================================================

/**
 * Stores all incoming Stripe webhook events for:
 * - Idempotency (prevent duplicate processing)
 * - Audit trail
 * - Debugging and replay capability
 *
 * Supports both V1 (snapshot) and V2 (thin) events.
 * ALL events are stored without filtering.
 */
export const stripeEvents = pgTable(
	"stripe_events",
	{
		// Stripe event ID (e.g., evt_xxx) - natural primary key for idempotency
		id: text("id").primaryKey(),
		// Event type (e.g., "checkout.session.completed", "v2.core.account[requirements].updated")
		eventType: text("event_type").notNull(),
		// Stripe API version that generated the event
		apiVersion: text("api_version"),
		// When Stripe created the event
		stripeCreatedAt: timestamp("stripe_created_at").notNull(),
		// When we received the webhook
		receivedAt: timestamp("received_at").defaultNow().notNull(),
		// When we finished processing (null if pending)
		processedAt: timestamp("processed_at"),
		// Current processing status
		processingStatus: text("processing_status", { enum: processingStatus })
			.notNull()
			.default("PENDING"),
		// Retry count for failed processing attempts
		retryCount: integer("retry_count").notNull().default(0),
		// Connected account ID (for Connect events, null for platform events)
		stripeAccountId: text("stripe_account_id"),
		// Related object ID extracted from payload (e.g., "acct_xxx", "cs_xxx")
		objectId: text("object_id"),
		// Related object type extracted from payload (e.g., "account", "checkout.session")
		objectType: text("object_type"),
		// Full event payload as JSONB (for V1: full event, for V2: thin event + fetched data)
		payload: jsonb("payload").notNull(),
	},
	(table) => [
		index("idx_stripe_events_type").on(table.eventType),
		index("idx_stripe_events_status").on(table.processingStatus),
		index("idx_stripe_events_account").on(table.stripeAccountId),
		index("idx_stripe_events_received").on(table.receivedAt),
	],
);

// Stripe Event types
export type StripeEvent = InferSelectModel<typeof stripeEvents>;
export type NewStripeEvent = InferInsertModel<typeof stripeEvents>;

// ============================================================================
// IMAGES
// ============================================================================

/**
 * Image type enum for categorizing uploaded images.
 */
export const imageType = [
	"item_image",
	"store_logo",
	"store_banner",
	"merchant_logo",
] as const;
export type ImageType = (typeof imageType)[number];

/**
 * Stores uploaded images with S3 keys and generated variants.
 * Variants (thumbnail, display) are generated asynchronously by a worker.
 */
export const images = pgTable(
	"images",
	{
		id: serial().primaryKey(),
		merchantId: integer("merchant_id")
			.notNull()
			.references(() => merchants.id, { onDelete: "cascade" }),
		type: text("type", { enum: imageType }).notNull(),

		// S3 storage
		key: text("key").notNull(), // {merchantId}/{type}/{uuid}.webp
		originalUrl: text("original_url").notNull(),
		thumbnailUrl: text("thumbnail_url"), // 200px - generated async
		displayUrl: text("display_url"), // 800px - generated async

		// Metadata
		filename: text("filename").notNull(),
		mimeType: text("mime_type").notNull(),
		sizeBytes: integer("size_bytes").notNull(),
		width: integer("width").notNull(),
		height: integer("height").notNull(),

		// Timestamps
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("idx_images_merchant").on(table.merchantId),
		index("idx_images_type").on(table.type),
	],
);

export const imagesRelations = relations(images, ({ one }) => ({
	merchant: one(merchants, {
		fields: [images.merchantId],
		references: [merchants.id],
	}),
}));

// ============================================================================
// MENU IMPORT JOBS
// ============================================================================

/**
 * Menu import job status.
 * - PROCESSING: File uploaded, processing in background
 * - READY: Processing complete, ready for user review
 * - COMPLETED: User applied selected changes
 * - FAILED: Processing failed
 */
export const menuImportStatus = [
	"PROCESSING",
	"READY",
	"COMPLETED",
	"FAILED",
] as const;
export type MenuImportStatus = (typeof menuImportStatus)[number];

/**
 * Tracks menu import jobs from file upload through AI extraction to user review.
 * Files are stored in the internal files bucket (not public).
 */
export const menuImportJobs = pgTable(
	"menu_import_jobs",
	{
		id: serial().primaryKey(),
		storeId: integer("store_id")
			.notNull()
			.references(() => stores.id, { onDelete: "cascade" }),

		// File info
		originalFilename: text("original_filename").notNull(),
		fileType: text("file_type").notNull(), // xlsx, csv, json, md, txt
		fileKey: text("file_key").notNull(), // S3 key in files bucket

		// Status
		status: text("status", { enum: menuImportStatus })
			.notNull()
			.default("PROCESSING"),
		errorMessage: text("error_message"),

		// Comparison result (JSONB) - populated when READY
		comparisonData: jsonb("comparison_data"),

		// Timestamp
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("idx_menu_import_jobs_store").on(table.storeId),
		index("idx_menu_import_jobs_status").on(table.status),
	],
);

export const menuImportJobsRelations = relations(menuImportJobs, ({ one }) => ({
	store: one(stores, {
		fields: [menuImportJobs.storeId],
		references: [stores.id],
	}),
}));

// ============================================================================
// SERVICE POINTS
// ============================================================================

/**
 * Service points represent physical or logical locations within a store
 * where customers can access the menu via QR code (e.g., tables, counters, kiosks).
 *
 * - Zone: optional grouping for batch activate/deactivate (e.g., "Outdoor", "Floor 1")
 * - JSONB attributes for arbitrary key-value tags
 * - Unique code per store for URL generation
 */
export const servicePoints = pgTable(
	"service_points",
	{
		id: serial().primaryKey(),
		storeId: integer("store_id")
			.notNull()
			.references(() => stores.id, { onDelete: "cascade" }),
		// URL-safe identifier (e.g., "table-5", "bar-counter")
		code: varchar("code", { length: 100 }).notNull(),
		// Permanent short code for QR URLs (e.g., "x7k2m9ab")
		// Never changes after creation - protects printed QR codes from breaking
		shortCode: varchar("short_code", { length: 8 }).notNull().unique(),
		// Display name (e.g., "Table 5", "Bar Counter")
		name: varchar("name", { length: 255 }).notNull(),
		// Optional zone for grouping (e.g., "Outdoor", "Floor 1", "VIP Section")
		zone: varchar("zone", { length: 100 }),
		// Optional description
		description: text(),
		// Flexible attributes as JSONB (e.g., { section: "outdoor", floor: 2 })
		attributes:
			jsonb("attributes").$type<Record<string, string | number | boolean>>(),
		// Display order for list views
		displayOrder: integer("display_order").notNull().default(0),
		// Active status
		isActive: boolean("is_active").notNull().default(true),
		// Timestamps
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("idx_service_points_store").on(table.storeId),
		index("idx_service_points_zone").on(table.storeId, table.zone),
		unique("unq_service_points_store_code").on(table.storeId, table.code),
	],
);

export const servicePointsRelations = relations(servicePoints, ({ one }) => ({
	store: one(stores, {
		fields: [servicePoints.storeId],
		references: [stores.id],
	}),
}));

// ============================================================================
// ORDERS
// ============================================================================

export const orders = pgTable(
	"orders",
	{
		id: serial().primaryKey(),
		storeId: integer("store_id")
			.notNull()
			.references(() => stores.id),

		// Customer info (snapshot, not FK - customers may not have accounts)
		customerName: varchar("customer_name", { length: 100 }),
		customerEmail: varchar("customer_email", { length: 255 }),
		customerPhone: varchar("customer_phone", { length: 50 }),

		// Order details
		orderType: text("order_type", { enum: orderTypes }).notNull(),
		status: text("status", { enum: orderStatuses })
			.notNull()
			.default("awaiting_payment"),

		// Service point (table, counter, etc.) - optional
		servicePointId: integer("service_point_id").references(
			() => servicePoints.id,
		),

		// Pricing (all in cents)
		subtotal: integer().notNull(), // Sum of item totals
		taxAmount: integer("tax_amount").notNull().default(0),
		tipAmount: integer("tip_amount").notNull().default(0),
		totalAmount: integer("total_amount").notNull(),

		// Payment
		paymentStatus: text("payment_status", { enum: paymentStatuses })
			.notNull()
			.default("pending"),
		paymentMethod: varchar("payment_method", { length: 50 }), // "card", "cash", "apple_pay", etc.
		stripeCheckoutSessionId: varchar("stripe_checkout_session_id", {
			length: 255,
		}),
		stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),

		// Notes
		customerNotes: text("customer_notes"), // Special requests from customer
		merchantNotes: text("merchant_notes"), // Internal notes from merchant

		// Timestamps
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		confirmedAt: timestamp("confirmed_at"),
		completedAt: timestamp("completed_at"),
	},
	(table) => [
		index("idx_orders_store_id").on(table.storeId),
		index("idx_orders_status").on(table.status),
		index("idx_orders_payment_status").on(table.paymentStatus),
		index("idx_orders_created_at").on(table.createdAt),
		index("idx_orders_store_status").on(table.storeId, table.status),
		index("idx_orders_stripe_session").on(table.stripeCheckoutSessionId),
	],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
	store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
	servicePoint: one(servicePoints, {
		fields: [orders.servicePointId],
		references: [servicePoints.id],
	}),
	items: many(orderItems),
}));

// ============================================================================
// ORDER ITEMS
// ============================================================================

export const orderItems = pgTable(
	"order_items",
	{
		id: serial().primaryKey(),
		orderId: integer("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),

		// Item reference (for analytics, can be null if item deleted)
		itemId: integer("item_id").references(() => items.id, {
			onDelete: "set null",
		}),

		// Snapshot data (preserved even if original item changes)
		name: varchar({ length: 200 }).notNull(),
		description: text(),
		quantity: integer().notNull(),
		unitPrice: integer("unit_price").notNull(), // Base price per unit (cents)
		optionsPrice: integer("options_price").notNull(), // Total options price per unit (cents)
		totalPrice: integer("total_price").notNull(), // (unitPrice + optionsPrice) * quantity

		// Metadata
		displayOrder: integer("display_order").notNull(),
	},
	(table) => [index("idx_order_items_order_id").on(table.orderId)],
);

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id],
	}),
	item: one(items, { fields: [orderItems.itemId], references: [items.id] }),
	options: many(orderItemOptions),
}));

// ============================================================================
// ORDER ITEM OPTIONS
// ============================================================================

export const orderItemOptions = pgTable(
	"order_item_options",
	{
		id: serial().primaryKey(),
		orderItemId: integer("order_item_id")
			.notNull()
			.references(() => orderItems.id, { onDelete: "cascade" }),

		// Option references (for analytics, can be null if deleted)
		optionGroupId: integer("option_group_id").references(
			() => optionGroups.id,
			{ onDelete: "set null" },
		),
		optionChoiceId: integer("option_choice_id").references(
			() => optionChoices.id,
			{ onDelete: "set null" },
		),

		// Snapshot data
		groupName: varchar("group_name", { length: 200 }).notNull(),
		choiceName: varchar("choice_name", { length: 200 }).notNull(),
		quantity: integer().notNull().default(1),
		priceModifier: integer("price_modifier").notNull(), // Price per unit (cents)
	},
	(table) => [
		index("idx_order_item_options_order_item_id").on(table.orderItemId),
	],
);

export const orderItemOptionsRelations = relations(
	orderItemOptions,
	({ one }) => ({
		orderItem: one(orderItems, {
			fields: [orderItemOptions.orderItemId],
			references: [orderItems.id],
		}),
		optionGroup: one(optionGroups, {
			fields: [orderItemOptions.optionGroupId],
			references: [optionGroups.id],
		}),
		optionChoice: one(optionChoices, {
			fields: [orderItemOptions.optionChoiceId],
			references: [optionChoices.id],
		}),
	}),
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Merchant types
export type Merchant = InferSelectModel<typeof merchants>;
export type NewMerchant = InferInsertModel<typeof merchants>;

// Store types
export type Store = InferSelectModel<typeof stores>;
export type NewStore = InferInsertModel<typeof stores>;

// Category types
export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

// Item types
export type Item = InferSelectModel<typeof items>;
export type NewItem = InferInsertModel<typeof items>;

// Option Group types
export type OptionGroup = InferSelectModel<typeof optionGroups>;
export type NewOptionGroup = InferInsertModel<typeof optionGroups>;

// Option Choice types
export type OptionChoice = InferSelectModel<typeof optionChoices>;
export type NewOptionChoice = InferInsertModel<typeof optionChoices>;

// Item Option Group types (junction)
export type ItemOptionGroup = InferSelectModel<typeof itemOptionGroups>;
export type NewItemOptionGroup = InferInsertModel<typeof itemOptionGroups>;

// Store Hours types
export type StoreHour = InferSelectModel<typeof storeHours>;
export type NewStoreHour = InferInsertModel<typeof storeHours>;

// Store Closures types
export type StoreClosure = InferSelectModel<typeof storeClosures>;
export type NewStoreClosure = InferInsertModel<typeof storeClosures>;

// Image types
export type Image = InferSelectModel<typeof images>;
export type NewImage = InferInsertModel<typeof images>;

// Service Point types
export type ServicePoint = InferSelectModel<typeof servicePoints>;
export type NewServicePoint = InferInsertModel<typeof servicePoints>;

// Order types
export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;

// Order Item types
export type OrderItem = InferSelectModel<typeof orderItems>;
export type NewOrderItem = InferInsertModel<typeof orderItems>;

// Order Item Option types
export type OrderItemOption = InferSelectModel<typeof orderItemOptions>;
export type NewOrderItemOption = InferInsertModel<typeof orderItemOptions>;

// Menu Import Job types
export type MenuImportJob = InferSelectModel<typeof menuImportJobs>;
export type NewMenuImportJob = InferInsertModel<typeof menuImportJobs>;
