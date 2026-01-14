/**
 * Menu Import Types
 *
 * Type definitions for menu import processing.
 */

/**
 * Allowed file types for menu import.
 */
export const allowedFileTypes = ["xlsx", "csv", "json", "md", "txt"] as const;
export type AllowedFileType = (typeof allowedFileTypes)[number];

/**
 * Extracted menu item from AI processing.
 */
export interface ExtractedItem {
	name: string;
	description?: string;
	price: number; // In cents
	allergens?: string[];
	categoryName: string;
}

/**
 * Extracted category from AI processing.
 */
export interface ExtractedCategory {
	name: string;
	description?: string;
	items: ExtractedItem[];
}

/**
 * Extracted option choice from AI processing.
 */
export interface ExtractedOptionChoice {
	name: string;
	priceModifier: number; // In cents
}

/**
 * Extracted option group from AI processing.
 */
export interface ExtractedOptionGroup {
	name: string;
	description?: string;
	type: "single_select" | "multi_select" | "quantity_select";
	isRequired: boolean;
	choices: ExtractedOptionChoice[];
	appliesTo: string[]; // Item names this option applies to
}

/**
 * Full extracted menu structure from AI.
 */
export interface ExtractedMenuData {
	categories: ExtractedCategory[];
	optionGroups: ExtractedOptionGroup[];
	confidence: number; // 0-1 confidence score
}

/**
 * Diff status for comparison.
 */
export type DiffAction = "create" | "update" | "skip";

/**
 * Field-level change for updates.
 */
export interface FieldChange {
	field: string;
	oldValue: unknown;
	newValue: unknown;
}

/**
 * Item comparison result.
 */
export interface ItemComparison {
	extracted: ExtractedItem;
	existingId?: string;
	existingName?: string;
	action: DiffAction;
	matchScore: number; // 0-1 similarity score
	changes?: FieldChange[];
}

/**
 * Category comparison result.
 */
export interface CategoryComparison {
	extracted: ExtractedCategory;
	existingId?: string;
	existingName?: string;
	action: DiffAction;
	matchScore: number;
	items: ItemComparison[];
}

/**
 * Option group comparison result.
 */
export interface OptionGroupComparison {
	extracted: ExtractedOptionGroup;
	existingId?: string;
	existingName?: string;
	action: DiffAction;
	matchScore: number;
}

/**
 * Summary of comparison results.
 */
export interface ComparisonSummary {
	totalCategories: number;
	newCategories: number;
	updatedCategories: number;
	totalItems: number;
	newItems: number;
	updatedItems: number;
	totalOptionGroups: number;
	newOptionGroups: number;
	updatedOptionGroups: number;
}

/**
 * Full comparison data stored in the job.
 */
export interface MenuComparisonData {
	extractedMenu: ExtractedMenuData;
	categories: CategoryComparison[];
	optionGroups: OptionGroupComparison[];
	summary: ComparisonSummary;
}

/**
 * Model configuration for AI extraction.
 */
export interface ModelConfig {
	/** OpenRouter model ID */
	id: string;
	/** Whether model supports JSON schema structured output */
	supportsStructuredOutput: boolean;
}

/**
 * Existing menu data structure for comparison.
 */
export interface ExistingMenuData {
	categories: {
		id: string;
		name: string;
		description?: string | null;
		items: {
			id: string;
			name: string;
			description?: string | null;
			price: number;
			allergens?: string[] | null;
		}[];
	}[];
	optionGroups: {
		id: string;
		name: string;
		description?: string | null;
		type: string;
	}[];
}

// ============================================================================
// Service Input/Output Types
// ============================================================================

/**
 * Input for uploading a menu import file
 */
export interface UploadImportFileInput {
	file: File;
	storeId: string;
}

/**
 * Result of uploading a menu import file
 */
export interface UploadImportFileResult {
	jobId: string;
	status: ImportJobStatusValue;
}

/**
 * Input for getting import job status
 */
export interface GetImportJobStatusInput {
	jobId: string;
}

/**
 * Import job status response
 */
export interface ImportJobStatus {
	id: string;
	storeId: string;
	originalFilename: string;
	fileType: string;
	status: ImportJobStatusValue;
	errorMessage: string | null;
	comparisonData: MenuComparisonData | null;
	createdAt: Date;
}

export const importJobStatusValues = [
	"PROCESSING",
	"READY",
	"COMPLETED",
	"FAILED",
] as const;

export type ImportJobStatusValue = (typeof importJobStatusValues)[number];

export function isImportJobStatus(
	value: string,
): value is ImportJobStatusValue {
	return importJobStatusValues.includes(value as ImportJobStatusValue);
}

/**
 * Input for applying import changes
 */
export interface ApplyImportChangesInput {
	jobId: string;
	storeId: string;
	selections: Array<{
		type: "category" | "item" | "optionGroup";
		extractedName: string;
		action: "apply" | "skip";
		matchedEntityId?: string;
	}>;
}

/**
 * Result of applying import changes
 */
export interface ApplyImportChangesResult {
	success: boolean;
	applied: {
		categories: number;
		items: number;
		optionGroups: number;
	};
}
