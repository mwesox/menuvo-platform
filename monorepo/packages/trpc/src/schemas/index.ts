/**
 * Shared Schemas
 *
 * This file exports Zod schemas that can be shared between:
 * - tRPC procedures (input validation)
 * - Client-side forms (form validation)
 * - API documentation
 *
 * Following the Three Schema Rule:
 * - Form schemas: String-based for HTML inputs
 * - API schemas: Typed for API contracts
 * - Database schemas: Drizzle insert/select types
 */

import { z } from "zod";

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Pagination input schema
 */
export const paginationSchema = z.object({
	limit: z.number().int().min(1).max(100).default(20),
	cursor: z.string().optional(),
});

/**
 * ID parameter schema
 */
export const idSchema = z.object({
	id: z.string().min(1),
});

// ============================================================================
// Store Schemas
// ============================================================================

/**
 * Store creation - API schema (typed)
 */
export const createStoreSchema = z.object({
	name: z.string().min(1).max(100),
	slug: z.string().min(1).max(50),
	description: z.string().max(500).optional(),
});

/**
 * Store creation - Form schema (strings)
 */
export const createStoreFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
	slug: z.string().min(1, "Slug is required").max(50),
	description: z.string().max(500).optional(),
});

/**
 * Store update - API schema
 */
export const updateStoreSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().max(500).optional(),
});

// ============================================================================
// Category Schemas
// ============================================================================

/**
 * Category creation - API schema
 */
export const createCategorySchema = z.object({
	storeId: z.string(),
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
	sortOrder: z.number().int().optional(),
});

/**
 * Category creation - Form schema
 */
export const createCategoryFormSchema = z.object({
	name: z.string().min(1, "Category name is required").max(100),
	description: z.string().max(500).optional(),
});

/**
 * Category update - API schema
 */
export const updateCategorySchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().max(500).optional(),
	sortOrder: z.number().int().optional(),
});

// ============================================================================
// Item Schemas
// ============================================================================

/**
 * Item creation - API schema
 */
export const createItemSchema = z.object({
	categoryId: z.string(),
	name: z.string().min(1).max(100),
	description: z.string().max(1000).optional(),
	price: z.number().int().min(0), // Price in cents
	imageUrl: z.string().url().optional(),
	isAvailable: z.boolean().default(true),
	sortOrder: z.number().int().optional(),
	allergens: z.array(z.string()).optional(),
	dietaryInfo: z.array(z.string()).optional(),
});

/**
 * Item creation - Form schema (strings for HTML inputs)
 */
export const createItemFormSchema = z.object({
	name: z.string().min(1, "Item name is required").max(100),
	description: z.string().max(1000).optional(),
	price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"), // String for form input
	imageUrl: z.string().url().optional().or(z.literal("")),
	allergens: z.string().optional(), // Comma-separated in form
	dietaryInfo: z.string().optional(), // Comma-separated in form
});

/**
 * Item update - API schema
 */
export const updateItemSchema = z.object({
	id: z.string(),
	categoryId: z.string().optional(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().max(1000).optional(),
	price: z.number().int().min(0).optional(),
	imageUrl: z.string().url().nullable().optional(),
	isAvailable: z.boolean().optional(),
	sortOrder: z.number().int().optional(),
	allergens: z.array(z.string()).optional(),
	dietaryInfo: z.array(z.string()).optional(),
});

// ============================================================================
// Order Schemas (Legacy - kept for backward compatibility)
// See order.schema.ts for comprehensive order schemas
// ============================================================================

/**
 * Order creation - Form schema (legacy)
 * @deprecated Use schemas from order.schema.ts instead
 */
export const createOrderFormSchema = z.object({
	customerName: z.string().max(100).optional(),
	customerPhone: z.string().max(20).optional(),
	customerEmail: z.string().email().optional().or(z.literal("")),
	tableNumber: z.string().max(20).optional(),
	notes: z.string().max(1000).optional(),
});

// ============================================================================
// Auth Schemas
// ============================================================================

/**
 * Magic link request schema
 */
export const magicLinkSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

/**
 * Magic link verification schema
 */
export const verifyMagicLinkSchema = z.object({
	token: z.string().min(1),
});

// ============================================================================
// Image Schemas
// ============================================================================

/**
 * Image type enum matching database schema
 */
export const imageTypeSchema = z.enum([
	"item_image",
	"store_logo",
	"store_banner",
	"merchant_logo",
]);

export type ImageType = z.infer<typeof imageTypeSchema>;

/**
 * Get image by ID - API schema
 */
export const getImageSchema = z.object({
	imageId: z.string().uuid(),
});

/**
 * Delete image - API schema
 */
export const deleteImageSchema = z.object({
	imageId: z.string().uuid(),
	merchantId: z.string().uuid(),
});

/**
 * Create image record - API schema
 * Used after file upload to S3 is complete
 */
export const createImageRecordSchema = z.object({
	merchantId: z.string().uuid(),
	type: imageTypeSchema,
	key: z.string().min(1),
	originalUrl: z.string().url(),
	thumbnailUrl: z.string().url().optional(),
	filename: z.string().min(1),
	mimeType: z.string().min(1),
	sizeBytes: z.number().int().positive(),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
});

export type GetImageInput = z.infer<typeof getImageSchema>;
export type DeleteImageInput = z.infer<typeof deleteImageSchema>;
export type CreateImageRecordInput = z.infer<typeof createImageRecordSchema>;

// ============================================================================
// Type Exports
// ============================================================================

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
// CreateCategoryInput and UpdateCategoryInput exported from category.schema.ts
// CreateOrderInput and OrderItemInput exported from order.schema.ts

// ============================================================================
// Merchant Schemas (re-exported from merchant.schema.ts)
// ============================================================================

export {
	type MerchantGeneralFormValues,
	type MerchantLanguagesFormValues,
	merchantGeneralFormSchema,
	merchantLanguagesFormSchema,
	type UpdateMerchantGeneralInput,
	type UpdateMerchantLanguagesInput,
	updateMerchantGeneralSchema,
	updateMerchantLanguagesSchema,
} from "./merchant.schema.js";

// ============================================================================
// Payment Schemas (re-exported from payment.schema.ts)
// ============================================================================

export {
	type MollieDashboardUrl,
	type MollieOnboardingInput,
	type MollieOnboardingResponse,
	type MollieStatus,
	mollieDashboardUrlSchema,
	mollieOnboardingResponseSchema,
	// Mollie
	mollieOnboardingSchema,
	mollieStatusSchema,
	type PaymentStatus,
	// Common
	paymentStatusSchema,
	type StripeAccountLinkResponse,
	type StripeOnboardingInput,
	type StripeStatus,
	stripeAccountLinkResponseSchema,
	// Stripe
	stripeOnboardingSchema,
	stripeStatusSchema,
} from "./payment.schema.js";

// ============================================================================
// Hours Schemas (re-exported from hours.schema.ts)
// ============================================================================

export {
	type DayOfWeek,
	type DeleteStoreHourInput,
	daysOfWeekSchema,
	deleteStoreHourSchema,
	type GetStoreHoursInput,
	getStoreHoursSchema,
	type SaveStoreHoursInput,
	type StoreHourEntry,
	saveStoreHoursSchema,
	storeHourEntrySchema,
} from "./hours.schema.js";

// ============================================================================
// Closures Schemas (re-exported from closures.schema.ts)
// ============================================================================

export {
	type CreateClosureInput,
	createClosureSchema,
	type DeleteClosureInput,
	deleteClosureSchema,
	type GetClosureByIdInput,
	getClosureByIdSchema,
	type ListClosuresInput,
	listClosuresSchema,
	type UpdateClosureInput,
	updateClosureSchema,
} from "./closures.schema.js";

// ============================================================================
// Store Schemas (re-exported from store.schema.ts)
// ============================================================================

export {
	// Types
	type CreateStoreApiInput,
	type CreateStoreFormValues,
	// API schemas
	createStoreApiSchema,
	// Form schemas
	createStoreFormSchema as storeCreateFormSchema,
	type DeleteStoreApiInput,
	deleteStoreApiSchema,
	type GetStoreByIdApiInput,
	type GetStoreBySlugApiInput,
	getStoreByIdApiSchema,
	getStoreBySlugApiSchema,
	type ToggleStoreActiveApiInput,
	toggleStoreActiveApiSchema,
	type UpdateStoreApiInput,
	type UpdateStoreFormValues,
	type UpdateStoreImageApiInput,
	updateStoreApiSchema,
	updateStoreFormSchema as storeUpdateFormSchema,
	updateStoreImageApiSchema,
} from "./store.schema.js";

// ============================================================================
// Service Point Schemas (re-exported from service-point.schema.ts)
// ============================================================================

export {
	// Types
	type BatchCreateServicePointsFormValues,
	type BatchCreateServicePointsInput,
	// Form Schemas
	batchCreateServicePointsFormSchema,
	// API Schemas
	batchCreateServicePointsSchema,
	type CreateServicePointInput,
	createServicePointSchema as createServicePointApiSchema,
	deleteServicePointSchema,
	getServicePointByCodeSchema,
	getServicePointByIdSchema,
	getServicePointByShortCodeSchema,
	getZonesSchema,
	listServicePointsSchema,
	type ServicePointFormValues,
	type ServicePointType,
	servicePointFormSchema,
	servicePointTypes,
	type ToggleServicePointInput,
	type ToggleZoneActiveInput,
	toggleServicePointSchema,
	toggleZoneActiveSchema,
	type UpdateServicePointInput,
	updateServicePointSchema as updateServicePointApiSchema,
} from "./service-point.schema.js";

// ============================================================================
// Subscription Schemas (re-exported from subscription.schema.ts)
// ============================================================================

export {
	// Response schemas
	type BillingPortalResponse,
	billingPortalResponseSchema,
	type CancelSubscriptionInput,
	type CancelSubscriptionResponse,
	type ChangePlanInput,
	type ChangePlanResponse,
	type CreateBillingPortalInput,
	cancelSubscriptionResponseSchema,
	// Input schemas
	cancelSubscriptionSchema,
	changePlanResponseSchema,
	changePlanSchema,
	createBillingPortalSchema,
	// Enums
	type PlanTier,
	planTierEnum,
	type ResumeSubscriptionResponse,
	resumeSubscriptionResponseSchema,
	type SubscriptionDetails,
	type SubscriptionStatusType,
	subscriptionDetailsSchema,
	subscriptionStatusEnum,
} from "./subscription.schema.js";

// ============================================================================
// Category Schemas (re-exported from category.schema.ts)
// ============================================================================

export {
	// Types
	type CategoryTranslation,
	type CategoryTranslations,
	type CreateCategoryInput,
	// Translation schemas
	categoryTranslationSchema,
	categoryTranslationsSchema,
	// API Schemas
	createCategorySchema as createCategoryApiSchema,
	type DeleteCategoryInput,
	deleteCategorySchema as deleteCategoryApiSchema,
	type GetCategoryByIdInput,
	getCategoryByIdSchema as getCategoryByIdApiSchema,
	type ListCategoriesInput,
	listCategoriesSchema as listCategoriesApiSchema,
	type ReorderCategoriesInput,
	reorderCategoriesSchema as reorderCategoriesApiSchema,
	type ToggleCategoryActiveInput,
	toggleCategoryActiveSchema as toggleCategoryActiveApiSchema,
	type UpdateCategoryInput,
	updateCategorySchema as updateCategoryApiSchema,
} from "./category.schema.js";

// ============================================================================
// Import Schemas (re-exported from import.schema.ts)
// ============================================================================

export {
	// Types
	type ApplyImportChangesInput,
	// API Schemas
	applyImportChangesSchema,
	type GetImportJobStatusInput,
	getImportJobStatusSchema,
	type ImportAction,
	type ImportEntityType,
	type ImportJobStatus,
	type ImportSelection,
	// Enum schemas
	importActionEnum,
	importEntityTypeEnum,
	importJobStatusSchema,
	importSelectionSchema,
} from "./import.schema.js";

// ============================================================================
// Item Schemas (re-exported from item.schema.ts)
// ============================================================================

export {
	// Types
	type CreateItemApiInput,
	type CreateItemFormValues,
	// API Schemas
	createItemApiSchema,
	// Form Schemas
	createItemFormSchema as itemCreateFormSchema,
	type DeleteItemInput,
	deleteItemSchema as deleteItemApiSchema,
	type GetItemByIdInput,
	getItemByIdSchema as getItemByIdApiSchema,
	type ItemTranslation,
	type ItemTranslationFormValues,
	type ItemTranslations,
	// Translation schemas
	itemTranslationFormSchema,
	itemTranslationSchema,
	itemTranslationsSchema,
	type ListItemsByCategoryInput,
	type ListItemsByStoreInput,
	listItemsByCategorySchema,
	listItemsByStoreSchema,
	type ReorderItemsInput,
	reorderItemsSchema as reorderItemsApiSchema,
	type ToggleItemAvailabilityInput,
	toggleItemAvailabilitySchema as toggleItemAvailabilityApiSchema,
	type UpdateItemApiInput,
	type UpdateItemFormValues,
	updateItemApiSchema,
	updateItemFormSchema as itemUpdateFormSchema,
} from "./item.schema.js";

// ============================================================================
// Option Schemas (re-exported from option.schema.ts)
// ============================================================================

export {
	// Types
	type ChoiceInput,
	type ChoiceTranslation,
	type ChoiceTranslations,
	type CreateOptionChoiceInput,
	type CreateOptionGroupInput,
	// API Schemas - Option Choices
	choiceInputSchema,
	// Translation schemas
	choiceTranslationSchema,
	choiceTranslationsSchema,
	createOptionChoiceSchema,
	// API Schemas - Option Groups
	createOptionGroupSchema,
	type DeleteOptionChoiceInput,
	type DeleteOptionGroupInput,
	deleteOptionChoiceSchema,
	deleteOptionGroupSchema,
	type EntityTranslation,
	type EntityTranslations,
	entityTranslationSchema,
	entityTranslationsSchema,
	type GetItemOptionsInput,
	type GetOptionGroupInput,
	// API Schemas - Item Options
	getItemOptionsSchema,
	getOptionGroupSchema,
	type ListOptionChoicesInput,
	type ListOptionGroupsInput,
	listOptionChoicesSchema,
	listOptionGroupsSchema,
	type OptionGroupType,
	// Enum schemas
	optionGroupTypeSchema,
	type SaveOptionGroupWithChoicesInput,
	saveOptionGroupWithChoicesSchema,
	type ToggleOptionChoiceAvailableInput,
	type ToggleOptionGroupActiveInput,
	toggleOptionChoiceAvailableSchema,
	toggleOptionGroupActiveSchema,
	type UpdateItemOptionsInput,
	type UpdateOptionChoiceInput,
	type UpdateOptionGroupInput,
	updateItemOptionsSchema,
	updateOptionChoiceSchema,
	updateOptionGroupSchema,
} from "./option.schema.js";

// ============================================================================
// Translation Schemas (re-exported from translation.schema.ts)
// ============================================================================

export {
	// Query schemas
	type GetMissingTranslationsInput,
	type GetTranslationStatusInput,
	getMissingTranslationsSchema,
	getTranslationStatusSchema,
	// Common schemas
	languageCodeSchema,
	// Mutation schemas
	type UpdateCategoryTranslationsInput,
	type UpdateItemTranslationsInput,
	type UpdateOptionChoiceTranslationsInput,
	type UpdateOptionGroupTranslationsInput,
	updateCategoryTranslationsSchema,
	updateItemTranslationsSchema,
	updateOptionChoiceTranslationsSchema,
	updateOptionGroupTranslationsSchema,
} from "./translation.schema.js";

// ============================================================================
// Public Schemas (re-exported from public.schema.ts)
// ============================================================================

export {
	// Input schemas
	type GetFeaturedStoresInput,
	type GetItemDetailsInput,
	type GetMenuInput,
	getFeaturedStoresSchema,
	getItemDetailsSchema,
	getMenuSchema,
	// Output schemas
	type MenuResponse,
	menuResponseSchema,
	type PublicCategory,
	type PublicItem,
	type PublicItemWithOptions,
	type PublicOptionChoice,
	type PublicOptionGroup,
	type PublicStore,
	publicCategorySchema,
	publicItemSchema,
	publicItemWithOptionsSchema,
	publicOptionChoiceSchema,
	publicOptionGroupSchema,
	publicStoreSchema,
	type SearchStoresInput,
	searchStoresSchema,
	type TranslatedEntity,
	translatedEntitySchema,
} from "./public.schema.js";

// ============================================================================
// Order Schemas (re-exported from order.schema.ts)
// ============================================================================

export {
	type CancelOrderInput,
	type CreateOrderInput,
	type CreateRefundInput,
	cancelOrderSchema,
	// Create schemas
	createOrderSchema as createOrderApiSchema,
	// Refund schemas
	createRefundSchema,
	type GetOrderByIdInput,
	type GetOrderByOrderIdInput,
	type GetOrderStatsInput,
	type GetOrdersForExportInput,
	// Query schemas
	getOrderByIdSchema,
	getOrderByOrderIdSchema,
	// Statistics schemas
	getOrderStatsSchema,
	// Export schemas
	getOrdersForExportSchema,
	type ListOrdersInput,
	listOrdersSchema,
	type OrderItemInput,
	type OrderItemOptionInput,
	type OrderStatsResponse,
	type OrderStatusType,
	type OrderTypeValue,
	// Item input schemas
	orderItemInputSchema,
	orderItemOptionInputSchema,
	orderStatsResponseSchema,
	// Enums
	orderStatusEnum,
	orderTypeEnum,
	type PaymentStatusType,
	paymentStatusEnum,
	type RefundResponse,
	refundResponseSchema,
	type UpdateOrderStatusInput,
	// Update schemas
	updateOrderStatusSchema,
} from "./order.schema.js";
