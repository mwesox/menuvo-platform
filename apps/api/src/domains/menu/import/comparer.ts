/**
 * Menu Comparer
 *
 * Compares extracted menu data with existing menu to generate diff.
 */

import type {
	CategoryComparison,
	ExistingMenuData,
	ExtractedCategory,
	ExtractedItem,
	ExtractedMenuData,
	ExtractedOptionGroup,
	FieldChange,
	ItemComparison,
	MenuComparisonData,
	OptionGroupComparison,
} from "./types";

// Match threshold for option groups (still uses Levenshtein)
const THRESHOLD_UPDATE = 0.7;

/**
 * Normalize null/undefined to undefined for consistent comparison.
 * Fixes false positives when comparing null vs undefined.
 */
function normalizeNullable<T>(value: T | null | undefined): T | undefined {
	return value === null ? undefined : value;
}

/**
 * Calculate Levenshtein distance between two strings.
 * Used for option group matching (categories/items use AI matching).
 */
function levenshteinDistance(a: string, b: string): number {
	const rows = a.length + 1;
	const cols = b.length + 1;
	const matrix: number[][] = Array.from({ length: rows }, () =>
		Array.from({ length: cols }, () => 0),
	);

	for (let i = 0; i < rows; i++) {
		(matrix[i] as number[])[0] = i;
	}
	for (let j = 0; j < cols; j++) {
		(matrix[0] as number[])[j] = j;
	}

	for (let i = 1; i < rows; i++) {
		for (let j = 1; j < cols; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			const row = matrix[i] as number[];
			const prevRow = matrix[i - 1] as number[];
			row[j] = Math.min(
				(prevRow[j] ?? 0) + 1,
				(row[j - 1] ?? 0) + 1,
				(prevRow[j - 1] ?? 0) + cost,
			);
		}
	}

	return (matrix[a.length] as number[])[b.length] ?? 0;
}

/**
 * Calculate similarity score between two strings (0-1).
 * Used for option group matching (categories/items use AI matching).
 */
function calculateSimilarity(str1: string, str2: string): number {
	const s1 = str1.toLowerCase().trim();
	const s2 = str2.toLowerCase().trim();

	if (s1 === s2) return 1.0;
	if (s1.length === 0 || s2.length === 0) return 0;

	const distance = levenshteinDistance(s1, s2);
	const maxLen = Math.max(s1.length, s2.length);

	return 1 - distance / maxLen;
}

/**
 * VAT group reference for comparison mapping.
 */
interface VatGroupRef {
	code: string;
	id: string;
}

/**
 * Compare extracted menu with existing menu.
 */
export function compareMenus(
	extracted: ExtractedMenuData,
	existing: ExistingMenuData,
	vatGroups?: VatGroupRef[],
): MenuComparisonData {
	// Build VAT code to ID mapping for comparison
	const vatCodeToIdMap = new Map(vatGroups?.map((v) => [v.code, v.id]) ?? []);

	const categoryComparisons = compareCategories(
		extracted.categories,
		existing.categories,
		vatCodeToIdMap,
	);
	const optionGroupComparisons = compareOptionGroups(
		extracted.optionGroups,
		existing.optionGroups,
	);

	const summary = {
		totalCategories: extracted.categories.length,
		newCategories: categoryComparisons.filter((c) => c.action === "create")
			.length,
		updatedCategories: categoryComparisons.filter((c) => c.action === "update")
			.length,
		totalItems: extracted.categories.reduce(
			(sum, c) => sum + c.items.length,
			0,
		),
		newItems: categoryComparisons
			.flatMap((c) => c.items)
			.filter((i) => i.action === "create").length,
		updatedItems: categoryComparisons
			.flatMap((c) => c.items)
			.filter((i) => i.action === "update").length,
		totalOptionGroups: extracted.optionGroups.length,
		newOptionGroups: optionGroupComparisons.filter((o) => o.action === "create")
			.length,
		updatedOptionGroups: optionGroupComparisons.filter(
			(o) => o.action === "update",
		).length,
	};

	return {
		extractedMenu: extracted,
		categories: categoryComparisons,
		optionGroups: optionGroupComparisons,
		summary,
	};
}

/**
 * Flatten all existing items with their category info for cross-category matching.
 */
function getAllExistingItems(existing: ExistingMenuData["categories"]) {
	return existing.flatMap((cat) =>
		cat.items.map((item) => ({
			...item,
			categoryId: cat.id,
			categoryName: cat.name,
		})),
	);
}

/**
 * Compare extracted categories with existing.
 * Uses AI's existingCategoryId for matching instead of Levenshtein distance.
 */
function compareCategories(
	extracted: ExtractedCategory[],
	existing: ExistingMenuData["categories"],
	vatCodeToIdMap: Map<string, string>,
): CategoryComparison[] {
	// Get all existing items for cross-category item matching
	const allExistingItems = getAllExistingItems(existing);

	return extracted.map((extCat) => {
		// Use AI's matched category ID if provided
		const matchedCategory = extCat.existingCategoryId
			? existing.find((e) => e.id === extCat.existingCategoryId)
			: null;

		// Compare items against all existing items (AI does cross-category matching)
		const itemComparisons = compareItems(
			extCat.items,
			allExistingItems,
			vatCodeToIdMap,
		);

		// Track category-level changes
		const categoryChanges: FieldChange[] = [];
		if (matchedCategory) {
			// Check VAT group change (convert code to ID for comparison)
			const newDefaultVatId = extCat.defaultVatGroupCode
				? vatCodeToIdMap.get(extCat.defaultVatGroupCode)
				: null;
			if (
				normalizeNullable(matchedCategory.defaultVatGroupId) !==
				normalizeNullable(newDefaultVatId)
			) {
				categoryChanges.push({
					field: "defaultVatGroupId",
					oldValue: matchedCategory.defaultVatGroupId,
					newValue: newDefaultVatId,
				});
			}
		}

		const hasChanges =
			itemComparisons.some((i) => i.action !== "skip") ||
			categoryChanges.length > 0;
		const matchScore = matchedCategory ? 1.0 : 0;
		const action = matchedCategory
			? hasChanges
				? "update"
				: "skip"
			: "create";

		return {
			extracted: extCat,
			existingId: matchedCategory?.id,
			existingName: matchedCategory?.name,
			action,
			matchScore,
			items: itemComparisons,
		};
	});
}

/** Item with category context from flattening */
type ExistingItemWithCategory =
	ExistingMenuData["categories"][0]["items"][0] & {
		categoryId: string;
		categoryName: string;
	};

/**
 * Compare extracted items with existing.
 * Uses AI's existingItemId for matching instead of Levenshtein distance.
 */
function compareItems(
	extracted: ExtractedItem[],
	allExistingItems: ExistingItemWithCategory[],
	vatCodeToIdMap: Map<string, string>,
): ItemComparison[] {
	return extracted.map((extItem) => {
		// Use AI's matched item ID if provided
		const matchedItem = extItem.existingItemId
			? allExistingItems.find((e) => e.id === extItem.existingItemId)
			: null;

		const changes: FieldChange[] = [];
		if (matchedItem) {
			// Price change
			if (extItem.price !== matchedItem.price) {
				changes.push({
					field: "price",
					oldValue: matchedItem.price,
					newValue: extItem.price,
				});
			}

			// Name change
			if (extItem.name !== matchedItem.name) {
				changes.push({
					field: "name",
					oldValue: matchedItem.name,
					newValue: extItem.name,
				});
			}

			// Description change (normalize null/undefined)
			const oldDesc = normalizeNullable(matchedItem.description);
			const newDesc = normalizeNullable(extItem.description);
			if (oldDesc !== newDesc) {
				changes.push({
					field: "description",
					oldValue: matchedItem.description,
					newValue: extItem.description,
				});
			}

			// Allergens change (compare as sorted JSON)
			const oldAllergens = JSON.stringify(
				[...(matchedItem.allergens ?? [])].sort(),
			);
			const newAllergens = JSON.stringify(
				[...(extItem.allergens ?? [])].sort(),
			);
			if (oldAllergens !== newAllergens) {
				changes.push({
					field: "allergens",
					oldValue: matchedItem.allergens,
					newValue: extItem.allergens,
				});
			}

			// VAT change (convert code to ID for comparison)
			const newVatId = extItem.vatGroupCode
				? vatCodeToIdMap.get(extItem.vatGroupCode)
				: null;
			if (
				normalizeNullable(matchedItem.vatGroupId) !==
				normalizeNullable(newVatId)
			) {
				changes.push({
					field: "vatGroupId",
					oldValue: matchedItem.vatGroupId,
					newValue: newVatId,
				});
			}
		}

		const matchScore = matchedItem ? 1.0 : 0;
		const action = matchedItem
			? changes.length > 0
				? "update"
				: "skip"
			: "create";

		return {
			extracted: extItem,
			existingId: matchedItem?.id,
			existingName: matchedItem?.name,
			action,
			matchScore,
			changes: changes.length > 0 ? changes : undefined,
		};
	});
}

/**
 * Compare extracted option groups with existing.
 * Still uses Levenshtein matching (not AI matching).
 */
function compareOptionGroups(
	extracted: ExtractedOptionGroup[],
	existing: ExistingMenuData["optionGroups"],
): OptionGroupComparison[] {
	return extracted.map((extGroup) => {
		let bestMatch: (typeof existing)[0] | undefined;
		let bestScore = 0;

		for (const exGroup of existing) {
			const score = calculateSimilarity(extGroup.name, exGroup.name);
			if (score > bestScore) {
				bestScore = score;
				bestMatch = exGroup;
			}
		}

		// Determine action based on match score
		const action =
			bestScore >= THRESHOLD_UPDATE && bestMatch ? "update" : "create";

		return {
			extracted: extGroup,
			existingId: bestMatch?.id,
			existingName: bestMatch?.name,
			action,
			matchScore: bestScore,
		};
	});
}
