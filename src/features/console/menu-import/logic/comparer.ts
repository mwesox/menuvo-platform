import type {
	CategoryComparison,
	DiffAction,
	ExtractedCategory,
	ExtractedItem,
	ExtractedMenuData,
	ExtractedOptionGroup,
	FieldChange,
	ItemComparison,
	MenuComparisonData,
	OptionGroupComparison,
} from "../types";

// Match thresholds
const THRESHOLD_EXACT = 0.95;
const THRESHOLD_UPDATE = 0.7;

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = [];

	for (let i = 0; i <= a.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= b.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1,
				matrix[i][j - 1] + 1,
				matrix[i - 1][j - 1] + cost,
			);
		}
	}

	return matrix[a.length][b.length];
}

/**
 * Calculate similarity score between two strings (0-1).
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
 * Calculate match score for items (name + price weighted).
 */
function calculateItemMatchScore(
	extracted: { name: string; price: number },
	existing: { name: string; price: number },
): number {
	const nameScore = calculateSimilarity(extracted.name, existing.name);

	// If names are very similar, high confidence
	if (nameScore > 0.9) return nameScore;

	// Factor in price similarity (within 20% = similar)
	const priceDiff = Math.abs(extracted.price - existing.price);
	const priceScore =
		existing.price > 0 ? Math.max(0, 1 - priceDiff / existing.price) : 0;

	// Weighted: 80% name, 20% price
	return nameScore * 0.8 + priceScore * 0.2;
}

/**
 * Determine action based on match score.
 */
function determineAction(score: number, hasChanges: boolean): DiffAction {
	if (score >= THRESHOLD_EXACT && !hasChanges) return "skip";
	if (score >= THRESHOLD_UPDATE) return "update";
	return "create";
}

/**
 * Existing menu data structure for comparison.
 */
export interface ExistingMenuData {
	categories: {
		id: number;
		name: string;
		description?: string | null;
		items: {
			id: number;
			name: string;
			description?: string | null;
			price: number;
			allergens?: string[] | null;
		}[];
	}[];
	optionGroups: {
		id: number;
		name: string;
		description?: string | null;
		type: string;
	}[];
}

/**
 * Compare extracted menu with existing menu.
 */
export function compareMenus(
	extracted: ExtractedMenuData,
	existing: ExistingMenuData,
): MenuComparisonData {
	const categoryComparisons = compareCategories(
		extracted.categories,
		existing.categories,
	);
	const optionGroupComparisons = compareOptionGroups(
		extracted.optionGroups,
		existing.optionGroups,
	);

	// Calculate summary
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
 * Compare extracted categories with existing.
 */
function compareCategories(
	extracted: ExtractedCategory[],
	existing: ExistingMenuData["categories"],
): CategoryComparison[] {
	return extracted.map((extCat) => {
		// Find best matching existing category
		let bestMatch: (typeof existing)[0] | undefined;
		let bestScore = 0;

		for (const exCat of existing) {
			const score = calculateSimilarity(extCat.name, exCat.name);
			if (score > bestScore) {
				bestScore = score;
				bestMatch = exCat;
			}
		}

		// Compare items within category
		const existingItems = bestMatch?.items || [];
		const itemComparisons = compareItems(extCat.items, existingItems);

		// Determine action
		const hasChanges = itemComparisons.some((i) => i.action !== "skip");
		const action = determineAction(bestScore, !hasChanges);

		return {
			extracted: extCat,
			existingId: bestMatch?.id,
			existingName: bestMatch?.name,
			action,
			matchScore: bestScore,
			items: itemComparisons,
		};
	});
}

/**
 * Compare extracted items with existing.
 */
function compareItems(
	extracted: ExtractedItem[],
	existing: ExistingMenuData["categories"][0]["items"],
): ItemComparison[] {
	return extracted.map((extItem) => {
		let bestMatch: (typeof existing)[0] | undefined;
		let bestScore = 0;

		for (const exItem of existing) {
			const score = calculateItemMatchScore(
				{ name: extItem.name, price: extItem.price },
				{ name: exItem.name, price: exItem.price },
			);
			if (score > bestScore) {
				bestScore = score;
				bestMatch = exItem;
			}
		}

		// Calculate field-level changes
		const changes: FieldChange[] = [];
		if (bestMatch) {
			if (extItem.price !== bestMatch.price) {
				changes.push({
					field: "price",
					oldValue: bestMatch.price,
					newValue: extItem.price,
				});
			}
			if (extItem.description !== (bestMatch.description || undefined)) {
				changes.push({
					field: "description",
					oldValue: bestMatch.description,
					newValue: extItem.description,
				});
			}
		}

		const action = determineAction(bestScore, changes.length > 0);

		return {
			extracted: extItem,
			existingId: bestMatch?.id,
			existingName: bestMatch?.name,
			action,
			matchScore: bestScore,
			changes: changes.length > 0 ? changes : undefined,
		};
	});
}

/**
 * Compare extracted option groups with existing.
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

		const action = determineAction(bestScore, false);

		return {
			extracted: extGroup,
			existingId: bestMatch?.id,
			existingName: bestMatch?.name,
			action,
			matchScore: bestScore,
		};
	});
}
