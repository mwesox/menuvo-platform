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
	existingId?: number;
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
	existingId?: number;
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
	existingId?: number;
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
 * Import job status response from server.
 */
export interface ImportJobStatusResponse {
	id: number;
	status: "PROCESSING" | "READY" | "COMPLETED" | "FAILED";
	errorMessage: string | null;
	comparisonData: MenuComparisonData | null;
}
