import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
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

/**
 * Category availability schedule configuration.
 * Controls when a category is visible to customers.
 */
export type CategoryAvailabilitySchedule = {
	/** Whether the schedule is enabled */
	enabled: boolean;
	/** Time range in HH:MM format (handles midnight crossover) */
	timeRange?: { startTime: string; endTime: string };
	/** Days of week when category is available */
	daysOfWeek?: Array<
		| "monday"
		| "tuesday"
		| "wednesday"
		| "thursday"
		| "friday"
		| "saturday"
		| "sunday"
	>;
	/** Date range when category is available (ISO date strings) */
	dateRange?: { startDate: string; endDate: string };
};

// ============================================================================
// VAT GROUPS
// ============================================================================

/**
 * VAT Groups - Merchant-managed tax categories.
 *
 * Each merchant creates their own VAT groups for their items/categories.
 * Common examples: "Food", "Beverages", "Alcohol", "Milk-based Drinks"
 */
export const vatGroups = pgTable(
	"vat_groups",
	{
		id: uuid().primaryKey().defaultRandom(),
		/** Merchant that owns this VAT group */
		merchantId: uuid("merchant_id")
			.notNull()
			.references(() => merchants.id, { onDelete: "cascade" }),
		/** Code for the group (e.g., "food", "drinks") - unique per merchant */
		code: varchar("code", { length: 50 }).notNull(),
		/** Display name for the group */
		name: varchar("name", { length: 100 }).notNull(),
		/** Optional description */
		description: text("description"),
		/** VAT rate in basis points (700 = 7%, 1900 = 19%) */
		rate: integer("rate").notNull().default(1900),
		/** Display order for UI */
		displayOrder: integer("display_order").notNull().default(0),
		// Timestamps
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at")
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("idx_vat_groups_merchant").on(table.merchantId),
		unique("unq_vat_groups_merchant_code").on(table.merchantId, table.code),
	],
);

export const vatGroupsRelations = relations(vatGroups, ({ one }) => ({
	merchant: one(merchants, {
		fields: [vatGroups.merchantId],
		references: [merchants.id],
	}),
}));

// ============================================================================
// MERCHANTS
// ============================================================================

export const merchants = pgTable("merchants", {
	id: uuid().primaryKey().defaultRandom(),
	name: varchar({ length: 255 }).notNull(),
	ownerName: varchar("owner_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull().unique(),
	phone: varchar({ length: 50 }),
	// Supported languages for menu translations (first is used as fallback)
	supportedLanguages: text("supported_languages")
		.array()
		.notNull()
		.default(sql`ARRAY
        ['de']::text[]`),
	// Stripe Connect (Payment provider integration)
	paymentAccountId: text("payment_account_id"),
	paymentOnboardingComplete: boolean("payment_onboarding_complete")
		.default(false)
		.notNull(),
	paymentCapabilitiesStatus: text("payment_capabilities_status"),
	paymentRequirementsStatus: text("payment_requirements_status"),
	// Subscription fields
	subscriptionStatus: text("subscription_status").default("none").notNull(),
	subscriptionId: text("subscription_id"),
	subscriptionPriceId: text("subscription_price_id"),
	subscriptionTrialEndsAt: timestamp("subscription_trial_ends_at"),
	subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
	// Mollie Connect (OAuth tokens for M2M operations)
	mollieCustomerId: text("mollie_customer_id"), // cst_xxx (for subscriptions)
	mollieOrganizationId: text("mollie_organization_id"), // org_xxx
	mollieProfileId: text("mollie_profile_id"), // pfl_xxx
	mollieAccessToken: text("mollie_access_token"), // OAuth access token (encrypted)
	mollieRefreshToken: text("mollie_refresh_token"), // OAuth refresh token (encrypted)
	mollieTokenExpiresAt: timestamp("mollie_token_expires_at"),
	mollieOnboardingStatus: text("mollie_onboarding_status"),
	mollieCanReceivePayments: boolean("mollie_can_receive_payments").default(
		false,
	),
	mollieCanReceiveSettlements: boolean(
		"mollie_can_receive_settlements",
	).default(false),
	// Mollie Subscriptions (mandate-based)
	mollieMandateId: text("mollie_mandate_id"), // mdt_xxx
	mollieMandateStatus: text("mollie_mandate_status"),
	mollieSubscriptionId: text("mollie_subscription_id"), // sub_xxx
	mollieSubscriptionStatus: text("mollie_subscription_status"),
	// Payment provider tracking
	paymentProvider: text("payment_provider").default("stripe"),
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
	id: uuid().primaryKey().defaultRandom(),
	merchantId: uuid("merchant_id")
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
	/** ISO 3166-1 alpha-2 country code for VAT calculation (e.g., "DE", "AT") */
	countryCode: varchar("country_code", { length: 2 }).notNull().default("DE"),
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
	settings: one(storeSettings),
}));

// ============================================================================
// STORE COUNTERS (Operational state - separate from configuration)
// ============================================================================

/**
 * Operational counters for stores, kept separate from store configuration.
 * Follows SRP: stores = config, store_counters = operational state.
 */
export const storeCounters = pgTable("store_counters", {
	storeId: uuid("store_id")
		.primaryKey()
		.references(() => stores.id, { onDelete: "cascade" }),
	// Last assigned pickup number (0-999, cycles continuously)
	pickupNumber: integer("pickup_number").notNull().default(0),
	// Timestamps
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const storeCountersRelations = relations(storeCounters, ({ one }) => ({
	store: one(stores, {
		fields: [storeCounters.storeId],
		references: [stores.id],
	}),
}));

// ============================================================================
// STORE SETTINGS (Consolidated settings - separate from store config)
// ============================================================================

/**
 * Type for order types configuration.
 * Configures which order types are available for a store.
 */
export type OrderTypesConfig = {
	dine_in: { enabled: boolean; displayOrder: number };
	takeaway: { enabled: boolean; displayOrder: number };
	delivery: { enabled: boolean; displayOrder: number };
};

/**
 * AI Recommendations configuration for a store.
 * Controls AI-powered cross-sell/upsell suggestions at checkout.
 */
export type AiRecommendationsConfig = {
	/** Whether AI recommendations are enabled */
	enabled: boolean;
	/** Individual pairing rules for AI context (e.g., "Pair pizza with cola") */
	pairingRules: string[];
	/** Tone for recommendation presentation */
	tone: "professional" | "friendly" | "playful";
};

/**
 * Store settings table for extensible store configuration.
 * 1:1 relationship with stores - storeId is the primary key.
 * Uses JSONB columns for flexible, extensible settings.
 */
export const storeSettings = pgTable("store_settings", {
	storeId: uuid("store_id")
		.primaryKey()
		.references(() => stores.id, { onDelete: "cascade" }),
	// Order types configuration (JSONB for flexibility)
	orderTypes: jsonb("order_types").$type<OrderTypesConfig>(),
	// AI Recommendations configuration
	aiRecommendations:
		jsonb("ai_recommendations").$type<AiRecommendationsConfig>(),
	// Future: add more JSONB columns for other settings
	// e.g., paymentConfig, notificationConfig, etc.
	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const storeSettingsRelations = relations(storeSettings, ({ one }) => ({
	store: one(stores, {
		fields: [storeSettings.storeId],
		references: [stores.id],
	}),
}));

// ============================================================================
// STORE HOURS
// ============================================================================

export const storeHours = pgTable(
	"store_hours",
	{
		id: uuid().primaryKey().defaultRandom(),
		storeId: uuid("store_id")
			.notNull()
			.references(() => stores.id, { onDelete: "cascade" }),
		dayOfWeek: text("day_of_week").notNull(),
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
		id: uuid().primaryKey().defaultRandom(),
		storeId: uuid("store_id")
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
	id: uuid().primaryKey().defaultRandom(),
	storeId: uuid("store_id")
		.notNull()
		.references(() => stores.id, { onDelete: "cascade" }),
	displayOrder: text("display_order").notNull().default("a0000"),
	isActive: boolean("is_active").notNull().default(true),
	// All translations stored uniformly: {"de": {name, description}, "en": {...}}
	translations: jsonb("translations")
		.$type<EntityTranslations>()
		.notNull()
		.default(sql`'{}'::jsonb`),
	/** Default VAT group for items in this category (items inherit unless overridden) */
	defaultVatGroupId: uuid("default_vat_group_id").references(
		() => vatGroups.id,
	),
	/** Availability schedule configuration (null = always visible) */
	availabilitySchedule: jsonb("availability_schedule")
		.$type<CategoryAvailabilitySchedule | null>()
		.default(null),
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
	defaultVatGroup: one(vatGroups, {
		fields: [categories.defaultVatGroupId],
		references: [vatGroups.id],
	}),
	items: many(items),
}));

// ============================================================================
// ITEMS
// ============================================================================

export const items = pgTable("items", {
	id: uuid().primaryKey().defaultRandom(),
	categoryId: uuid("category_id")
		.notNull()
		.references(() => categories.id, { onDelete: "cascade" }),
	storeId: uuid("store_id")
		.notNull()
		.references(() => stores.id, { onDelete: "cascade" }),
	price: integer().notNull(), // Price in cents
	imageUrl: varchar("image_url", { length: 500 }),
	allergens: text().array(), // PostgreSQL text array for allergens
	displayOrder: text("display_order").notNull().default("a0000"),
	isActive: boolean("is_active").notNull().default(true),
	// Optional short name for kitchen display (e.g., "SALMN" instead of "Grilled Atlantic Salmon")
	kitchenName: varchar("kitchen_name", { length: 50 }),
	// All translations stored uniformly: {"de": {name, description}, "en": {...}}
	translations: jsonb("translations")
		.$type<EntityTranslations>()
		.notNull()
		.default(sql`'{}'::jsonb`),
	/** VAT group override (NULL = inherit from category's defaultVatGroupId) */
	vatGroupId: uuid("vat_group_id").references(() => vatGroups.id),
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
	optGroups: many(itemOptionGroups),
}));

// ============================================================================
// OPTION GROUPS
// ============================================================================

export const optionGroups = pgTable("option_groups", {
	id: uuid().primaryKey().defaultRandom(),
	storeId: uuid("store_id")
		.notNull()
		.references(() => stores.id, { onDelete: "cascade" }),
	// Option group type (determines UI rendering)
	type: text("type").notNull().default("multi_select"),
	isRequired: boolean("is_required").notNull().default(false),
	minSelections: integer("min_selections").notNull().default(0),
	maxSelections: integer("max_selections"), // null = unlimited
	// Free options (e.g., "first 2 toppings free, extras cost extra")
	numFreeOptions: integer("num_free_options").notNull().default(0),
	// Aggregate quantity constraints (for quantity_select type)
	aggregateMinQuantity: integer("aggregate_min_quantity"), // null = no min
	aggregateMaxQuantity: integer("aggregate_max_quantity"), // null = no max
	displayOrder: text("display_order").notNull().default("a0000"),
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
		choices: many(optionChoices),
		optGroups: many(itemOptionGroups),
	}),
);

// ============================================================================
// OPTION CHOICES
// ============================================================================

export const optionChoices = pgTable("option_choices", {
	id: uuid().primaryKey().defaultRandom(),
	optionGroupId: uuid("option_group_id")
		.notNull()
		.references(() => optionGroups.id, { onDelete: "cascade" }),
	priceModifier: integer("price_modifier").notNull().default(0), // In cents, can be positive/negative
	displayOrder: text("display_order").notNull().default("a0000"),
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
	/** VAT group override for this choice (NULL = inherit from parent item) */
	vatGroupId: uuid("vat_group_id").references(() => vatGroups.id),
	// Timestamps
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const optionChoicesRelations = relations(optionChoices, ({ one }) => ({
	optGroup: one(optionGroups, {
		fields: [optionChoices.optionGroupId],
		references: [optionGroups.id],
	}),
}));

// ============================================================================
// ITEM OPTION GROUPS (Junction Table)
// ============================================================================

export const itemOptionGroups = pgTable("item_option_groups", {
	id: uuid().primaryKey().defaultRandom(),
	itemId: uuid("item_id")
		.notNull()
		.references(() => items.id, { onDelete: "cascade" }),
	optionGroupId: uuid("option_group_id")
		.notNull()
		.references(() => optionGroups.id, { onDelete: "cascade" }),
	displayOrder: text("display_order").notNull().default("a0000"),
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
		optGroup: one(optionGroups, {
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
		processingStatus: text("processing_status").notNull().default("PENDING"),
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
// MOLLIE EVENTS
// ============================================================================

/**
 * Stores all incoming Mollie webhook events for:
 * - Idempotency (prevent duplicate processing)
 * - Audit trail
 * - Debugging and replay capability
 *
 * Mollie webhooks only send the resource ID - we must fetch full data from API.
 * The payload field stores the fetched resource data.
 */
export const mollieEvents = pgTable(
	"mollie_events",
	{
		// Generated event ID (Mollie doesn't send event IDs, we generate them)
		id: text("id").primaryKey(),
		// Event type (e.g., "payment.paid", "subscription.created")
		eventType: text("event_type").notNull(),
		// Resource ID from webhook (e.g., "tr_xxx", "sub_xxx")
		resourceId: text("resource_id").notNull(),
		// Resource type (e.g., "payment", "subscription", "refund")
		resourceType: text("resource_type").notNull(),
		// Merchant ID for this event (from payment metadata or context)
		merchantId: uuid("merchant_id").references(() => merchants.id),
		// When we received the webhook
		receivedAt: timestamp("received_at").defaultNow().notNull(),
		// When we finished processing (null if pending)
		processedAt: timestamp("processed_at"),
		// Current processing status
		processingStatus: text("processing_status").notNull().default("PENDING"),
		// Retry count for failed processing attempts
		retryCount: integer("retry_count").notNull().default(0),
		// Full resource data fetched from Mollie API as JSONB
		payload: jsonb("payload").notNull(),
	},
	(table) => [
		index("idx_mollie_events_type").on(table.eventType),
		index("idx_mollie_events_status").on(table.processingStatus),
		index("idx_mollie_events_resource").on(table.resourceId),
		index("idx_mollie_events_received").on(table.receivedAt),
		index("idx_mollie_events_merchant").on(table.merchantId),
	],
);

// Mollie Event types
export type MollieEvent = InferSelectModel<typeof mollieEvents>;
export type NewMollieEvent = InferInsertModel<typeof mollieEvents>;

// ============================================================================
// IMAGES
// ============================================================================

/**
 * Stores uploaded images with S3 keys and generated variants.
 * Variants (thumbnail, display) are generated asynchronously by a worker.
 */
export const images = pgTable(
	"images",
	{
		id: uuid().primaryKey().defaultRandom(),
		merchantId: uuid("merchant_id")
			.notNull()
			.references(() => merchants.id, { onDelete: "cascade" }),
		type: text("type").notNull(),

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
 * Tracks menu import jobs from file upload through AI extraction to user review.
 * Files are stored in the internal files bucket (not public).
 */
export const menuImportJobs = pgTable(
	"menu_import_jobs",
	{
		id: uuid().primaryKey().defaultRandom(),
		storeId: uuid("store_id")
			.notNull()
			.references(() => stores.id, { onDelete: "cascade" }),

		// File info
		originalFilename: text("original_filename").notNull(),
		fileType: text("file_type").notNull(), // xlsx, csv, json, md, txt
		fileKey: text("file_key").notNull(), // S3 key in files bucket

		// Status
		status: text("status").notNull().default("PROCESSING"),
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
		id: uuid().primaryKey().defaultRandom(),
		storeId: uuid("store_id")
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
		id: uuid().primaryKey().defaultRandom(),
		storeId: uuid("store_id")
			.notNull()
			.references(() => stores.id),
		merchantId: uuid("merchant_id")
			.notNull()
			.references(() => merchants.id),
		// Human-readable pickup number (0-999, like McDonald's)
		pickupNumber: integer("pickup_number").notNull(),

		// Customer info (snapshot, not FK - customers may not have accounts)
		customerName: varchar("customer_name", { length: 100 }),
		customerEmail: varchar("customer_email", { length: 255 }),
		customerPhone: varchar("customer_phone", { length: 50 }),

		// Order details
		orderType: text("order_type").notNull(),
		status: text("status").notNull().default("awaiting_payment"),

		// Service point (table, counter, etc.) - optional
		servicePointId: uuid("service_point_id").references(() => servicePoints.id),

		// Pricing (all in cents)
		subtotal: integer().notNull(), // Sum of item totals (gross amounts)
		/** Total net amount before VAT (cents) - calculated from gross */
		netAmount: integer("net_amount"),
		taxAmount: integer("tax_amount").notNull().default(0),
		tipAmount: integer("tip_amount").notNull().default(0),
		totalAmount: integer("total_amount").notNull(),
		/** Country code at order time for VAT calculation snapshot */
		vatCountryCode: varchar("vat_country_code", { length: 2 }),

		// Payment
		paymentStatus: text("payment_status").notNull().default("pending"),
		paymentMethod: varchar("payment_method", { length: 50 }), // "card", "cash", "apple_pay", etc.
		stripeCheckoutSessionId: varchar("stripe_checkout_session_id", {
			length: 255,
		}),
		stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
		// Mollie payment fields
		molliePaymentId: text("mollie_payment_id"), // tr_xxx
		mollieCheckoutUrl: text("mollie_checkout_url"),
		// Payment provider tracking (per-order, overrides merchant default)
		orderPaymentProvider: text("order_payment_provider"),

		// Notes
		customerNotes: text("customer_notes"), // Special requests from customer
		merchantNotes: text("merchant_notes"), // Internal notes from merchant

		// Scheduled pickup time (for pre-orders and takeaway orders)
		scheduledPickupTime: timestamp("scheduled_pickup_time"),

		// Idempotency key for preventing duplicate orders
		idempotencyKey: varchar("idempotency_key", { length: 36 }), // UUID string

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
		index("idx_orders_merchant_id").on(table.merchantId),
		index("idx_orders_status").on(table.status),
		index("idx_orders_payment_status").on(table.paymentStatus),
		index("idx_orders_created_at").on(table.createdAt),
		index("idx_orders_store_status").on(table.storeId, table.status),
		index("idx_orders_stripe_session").on(table.stripeCheckoutSessionId),
		index("idx_orders_mollie_payment").on(table.molliePaymentId),
		index("idx_orders_store_pickup").on(table.storeId, table.pickupNumber),
		unique("idx_orders_idempotency_key").on(table.idempotencyKey),
		// Polling optimization indexes
		index("idx_orders_store_completed_at").on(table.storeId, table.completedAt), // For kitchenDone query
		index("idx_orders_store_status_created").on(
			table.storeId,
			table.status,
			table.createdAt,
		), // For listForKitchen query
		index("idx_orders_store_created_at").on(table.storeId, table.createdAt), // For listByStore date range queries
	],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
	store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
	servicePoint: one(servicePoints, {
		fields: [orders.servicePointId],
		references: [servicePoints.id],
	}),
	items: many(orderItems),
	vatLines: many(orderVatLines),
}));

// ============================================================================
// ORDER ITEMS
// ============================================================================

export const orderItems = pgTable(
	"order_items",
	{
		id: uuid().primaryKey().defaultRandom(),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),

		// Item reference (for analytics, can be null if item deleted)
		itemId: uuid("item_id").references(() => items.id, {
			onDelete: "set null",
		}),

		// Snapshot data (preserved even if original item changes)
		name: varchar({ length: 200 }).notNull(),
		kitchenName: varchar("kitchen_name", { length: 50 }), // Short name for kitchen display
		description: text(),
		quantity: integer().notNull(),
		unitPrice: integer("unit_price").notNull(), // Base price per unit (cents) - gross
		optionsPrice: integer("options_price").notNull(), // Total options price per unit (cents) - gross
		totalPrice: integer("total_price").notNull(), // (unitPrice + optionsPrice) * quantity - gross

		// VAT snapshot at order time
		/** VAT group code snapshot (e.g., "food", "drinks") */
		vatGroupCode: varchar("vat_group_code", { length: 50 }),
		/** VAT rate at order time (basis points: 700 = 7%) */
		vatRate: integer("vat_rate"),
		/** Net price before VAT (cents) */
		netPrice: integer("net_price"),
		/** VAT amount (cents) */
		vatAmount: integer("vat_amount"),

		// Metadata
		displayOrder: integer("display_order").notNull(),
		// AI Recommendations attribution
		fromRecommendation: boolean("from_recommendation").notNull().default(false),
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
		id: uuid().primaryKey().defaultRandom(),
		orderItemId: uuid("order_item_id")
			.notNull()
			.references(() => orderItems.id, { onDelete: "cascade" }),

		// Option references (for analytics, can be null if deleted)
		optionGroupId: uuid("option_group_id").references(() => optionGroups.id, {
			onDelete: "set null",
		}),
		optionChoiceId: uuid("option_choice_id").references(
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
// ORDER VAT LINES
// ============================================================================

/**
 * Order VAT Lines - VAT breakdown per order for receipt compliance.
 *
 * Each line represents one VAT rate applied to the order.
 * All amounts are in cents and are snapshots at order creation time.
 *
 * Receipt display:
 * | Net (7%):  €23.36 |
 * | VAT (7%):  € 1.64 |
 * | Net (19%): € 8.40 |
 * | VAT (19%): € 1.60 |
 * | Total:     €35.00 |
 */
export const orderVatLines = pgTable(
	"order_vat_lines",
	{
		id: uuid().primaryKey().defaultRandom(),
		/** Reference to order */
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		/** Snapshot of VAT group code at order time */
		vatGroupCode: varchar("vat_group_code", { length: 50 }).notNull(),
		/** Snapshot of VAT group name at order time */
		vatGroupName: varchar("vat_group_name", { length: 100 }).notNull(),
		/** VAT rate at order time (basis points: 700 = 7%) */
		rate: integer("rate").notNull(),
		/** Net amount before VAT (cents) */
		netAmount: integer("net_amount").notNull(),
		/** VAT amount (cents) */
		vatAmount: integer("vat_amount").notNull(),
		/** Gross amount including VAT (cents) */
		grossAmount: integer("gross_amount").notNull(),
		// Timestamp
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [index("idx_order_vat_lines_order").on(table.orderId)],
);

export const orderVatLinesRelations = relations(orderVatLines, ({ one }) => ({
	order: one(orders, {
		fields: [orderVatLines.orderId],
		references: [orders.id],
	}),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Merchant types
export type Merchant = InferSelectModel<typeof merchants>;
export type NewMerchant = InferInsertModel<typeof merchants>;

// Store types
export type Store = InferSelectModel<typeof stores>;
export type NewStore = InferInsertModel<typeof stores>;

// Store Counter types
export type StoreCounter = InferSelectModel<typeof storeCounters>;
export type NewStoreCounter = InferInsertModel<typeof storeCounters>;

// Store Settings types
export type StoreSettingsRow = InferSelectModel<typeof storeSettings>;
export type NewStoreSettingsRow = InferInsertModel<typeof storeSettings>;

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

// VAT Group types
export type VatGroup = InferSelectModel<typeof vatGroups>;
export type NewVatGroup = InferInsertModel<typeof vatGroups>;

// Order VAT Line types
export type OrderVatLine = InferSelectModel<typeof orderVatLines>;
export type NewOrderVatLine = InferInsertModel<typeof orderVatLines>;
