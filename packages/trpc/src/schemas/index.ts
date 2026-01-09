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

import { imageType } from "@menuvo/db/schema";
import { z } from "zod";
import type {
	createItemApiSchema,
	updateItemApiSchema,
} from "./item.schema.js";
import type {
	createStoreApiSchema,
	updateStoreApiSchema,
} from "./store.schema.js";

// ============================================================================
// Image Schemas
// ============================================================================

/**
 * Image type enum derived from database schema
 */
export const imageTypeSchema = z.enum(imageType);

export type ImageType = z.infer<typeof imageTypeSchema>;

// ============================================================================
// Constants (derived from DB schema)
// ============================================================================

export { daysOfWeek, imageType } from "@menuvo/db/schema";

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

export type CreateStoreInput = z.infer<typeof createStoreApiSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreApiSchema>;
export type CreateItemInput = z.infer<typeof createItemApiSchema>;
export type UpdateItemInput = z.infer<typeof updateItemApiSchema>;
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
