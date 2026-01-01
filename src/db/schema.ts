import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

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
// MERCHANTS
// ============================================================================

export const merchants = pgTable("merchants", {
	id: serial().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull().unique(),
	phone: varchar({ length: 50 }),
	primaryLanguage: varchar("primary_language", { length: 10 })
		.notNull()
		.default("en"),
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
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	displayOrder: integer("display_order").notNull().default(0),
	isActive: boolean("is_active").notNull().default(true),
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
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	price: integer().notNull(), // Price in cents
	imageUrl: varchar("image_url", { length: 500 }),
	allergens: text().array(), // PostgreSQL text array for allergens
	displayOrder: integer("display_order").notNull().default(0),
	isAvailable: boolean("is_available").notNull().default(true),
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
// OPTION GROUPS
// ============================================================================

export const optionGroups = pgTable("option_groups", {
	id: serial().primaryKey(),
	storeId: integer("store_id")
		.notNull()
		.references(() => stores.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	isRequired: boolean("is_required").notNull().default(false),
	minSelections: integer("min_selections").notNull().default(0),
	maxSelections: integer("max_selections"), // null = unlimited
	displayOrder: integer("display_order").notNull().default(0),
	isActive: boolean("is_active").notNull().default(true),
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
	name: varchar({ length: 255 }).notNull(),
	priceModifier: integer("price_modifier").notNull().default(0), // In cents, can be positive/negative
	displayOrder: integer("display_order").notNull().default(0),
	isAvailable: boolean("is_available").notNull().default(true),
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
