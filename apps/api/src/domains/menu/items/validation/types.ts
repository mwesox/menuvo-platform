/**
 * Item Validation Types
 *
 * Types for the item validation/readiness system that validates
 * items before publishing and provides user-facing issues.
 */

/**
 * Issue codes for item validation
 *
 * Each code corresponds to a specific validation rule that can fail.
 * All issues block publishing (isPublishable = false).
 */
export type ItemIssueCode =
	| "MISSING_NAME" // no name in default language
	| "MISSING_VAT_GROUP" // no VAT on item AND no default on category
	| "MISSING_CATEGORY" // item not in a category
	| "ZERO_PRICE" // price is 0
	| "CATEGORY_INACTIVE"; // parent category is inactive

/**
 * Individual issue for an item
 */
export interface ItemIssue {
	/** Issue code for i18n lookup */
	code: ItemIssueCode;
	/** Optional field name for focusing in UI */
	field?: string;
}

/**
 * Complete validation result for an item
 */
export interface ItemValidationResult {
	/** List of all issues */
	issues: ItemIssue[];
	/** Whether there are any issues */
	hasIssues: boolean;
	/** Whether the item can be published (no issues) */
	isPublishable: boolean;
}

/**
 * Context required for item validation
 *
 * This context is passed to validation rules to access
 * related data like category settings and store defaults.
 */
export interface ItemValidationContext {
	/** Default language for the store/merchant */
	defaultLanguage: string;
	/** VAT group ID from the category (if set) */
	categoryDefaultVatGroupId: string | null;
	/** Whether the parent category is active */
	categoryIsActive: boolean;
}

/**
 * Item data needed for validation
 *
 * Subset of item fields that validation rules inspect.
 */
export interface ItemForValidation {
	/** Item translations (name per language) */
	translations: Record<string, { name?: string; description?: string }> | null;
	/** VAT group ID set on item (null = inherit from category) */
	vatGroupId: string | null;
	/** Category ID */
	categoryId: string | null;
	/** Price in cents */
	price: number;
	/** Image URL */
	imageUrl: string | null;
	/** Whether item is active (user wants it available) */
	isActive: boolean;
}
