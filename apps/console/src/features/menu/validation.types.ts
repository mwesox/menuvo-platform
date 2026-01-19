/**
 * Shared validation types for menu items
 *
 * These types match the API response structure for item validation.
 */

/**
 * Issue codes from the API
 */
export type ItemIssueCode =
	| "MISSING_NAME"
	| "MISSING_VAT_GROUP"
	| "MISSING_CATEGORY"
	| "ZERO_PRICE"
	| "MISSING_IMAGE"
	| "CATEGORY_INACTIVE";

/**
 * Single issue from the API
 */
export interface ItemIssue {
	code: ItemIssueCode;
	field?: string;
}

/**
 * Validation result from the API
 */
export interface ItemValidationResult {
	issues: ItemIssue[];
	hasIssues: boolean;
	isPublishable: boolean;
}
