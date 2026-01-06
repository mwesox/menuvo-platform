import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
	categories,
	items,
	optionChoices,
	optionGroups,
	stores,
} from "@/db/schema";

// ============================================================================
// STORE OWNERSHIP
// ============================================================================

/**
 * Validates that a store belongs to the given merchant.
 */
export async function validateStoreOwnership(
	storeId: number,
	merchantId: number,
): Promise<boolean> {
	const store = await db.query.stores.findFirst({
		where: and(eq(stores.id, storeId), eq(stores.merchantId, merchantId)),
		columns: { id: true },
	});
	return !!store;
}

/**
 * Gets a store if it belongs to the merchant, including merchant data.
 */
export async function getStoreWithMerchant(
	storeId: number,
	merchantId: number,
) {
	return db.query.stores.findFirst({
		where: and(eq(stores.id, storeId), eq(stores.merchantId, merchantId)),
		with: {
			merchant: {
				columns: { supportedLanguages: true },
			},
		},
	});
}

// ============================================================================
// CATEGORY OWNERSHIP
// ============================================================================

/**
 * Validates that a category belongs to the given merchant (via store).
 */
export async function validateCategoryOwnership(
	categoryId: number,
	merchantId: number,
): Promise<boolean> {
	const category = await db.query.categories.findFirst({
		where: eq(categories.id, categoryId),
		with: {
			store: {
				columns: { merchantId: true },
			},
		},
	});
	return category?.store.merchantId === merchantId;
}

/**
 * Gets a category if it belongs to the merchant (via store).
 */
export async function getCategoryWithOwnership(
	categoryId: number,
	merchantId: number,
) {
	const category = await db.query.categories.findFirst({
		where: eq(categories.id, categoryId),
		with: {
			store: {
				columns: { id: true, merchantId: true },
				with: {
					merchant: {
						columns: { supportedLanguages: true },
					},
				},
			},
		},
	});

	if (category?.store.merchantId !== merchantId) {
		return null;
	}

	return category;
}

// ============================================================================
// ITEM OWNERSHIP
// ============================================================================

/**
 * Validates that an item belongs to the given merchant (via store).
 */
export async function validateItemOwnership(
	itemId: number,
	merchantId: number,
): Promise<boolean> {
	const item = await db.query.items.findFirst({
		where: eq(items.id, itemId),
		with: {
			store: {
				columns: { merchantId: true },
			},
		},
	});
	return item?.store.merchantId === merchantId;
}

/**
 * Gets an item if it belongs to the merchant (via store).
 */
export async function getItemWithOwnership(itemId: number, merchantId: number) {
	const item = await db.query.items.findFirst({
		where: eq(items.id, itemId),
		with: {
			store: {
				columns: { id: true, merchantId: true },
				with: {
					merchant: {
						columns: { supportedLanguages: true },
					},
				},
			},
		},
	});

	if (item?.store.merchantId !== merchantId) {
		return null;
	}

	return item;
}

// ============================================================================
// OPTION GROUP OWNERSHIP
// ============================================================================

/**
 * Validates that an option group belongs to the given merchant (via store).
 */
export async function validateOptionGroupOwnership(
	optionGroupId: number,
	merchantId: number,
): Promise<boolean> {
	const optionGroup = await db.query.optionGroups.findFirst({
		where: eq(optionGroups.id, optionGroupId),
		with: {
			store: {
				columns: { merchantId: true },
			},
		},
	});
	return optionGroup?.store.merchantId === merchantId;
}

/**
 * Gets an option group if it belongs to the merchant (via store).
 */
export async function getOptionGroupWithOwnership(
	optionGroupId: number,
	merchantId: number,
) {
	const optionGroup = await db.query.optionGroups.findFirst({
		where: eq(optionGroups.id, optionGroupId),
		with: {
			store: {
				columns: { id: true, merchantId: true },
				with: {
					merchant: {
						columns: { supportedLanguages: true },
					},
				},
			},
		},
	});

	if (optionGroup?.store.merchantId !== merchantId) {
		return null;
	}

	return optionGroup;
}

// ============================================================================
// OPTION CHOICE OWNERSHIP
// ============================================================================

/**
 * Validates that an option choice belongs to the given merchant (via option group -> store).
 */
export async function validateOptionChoiceOwnership(
	optionChoiceId: number,
	merchantId: number,
): Promise<boolean> {
	const optionChoice = await db.query.optionChoices.findFirst({
		where: eq(optionChoices.id, optionChoiceId),
		with: {
			optGroup: {
				with: {
					store: {
						columns: { merchantId: true },
					},
				},
			},
		},
	});
	return optionChoice?.optGroup.store.merchantId === merchantId;
}

/**
 * Gets an option choice if it belongs to the merchant (via option group -> store).
 */
export async function getOptionChoiceWithOwnership(
	optionChoiceId: number,
	merchantId: number,
) {
	const optionChoice = await db.query.optionChoices.findFirst({
		where: eq(optionChoices.id, optionChoiceId),
		with: {
			optGroup: {
				columns: { id: true },
				with: {
					store: {
						columns: { id: true, merchantId: true },
						with: {
							merchant: {
								columns: { supportedLanguages: true },
							},
						},
					},
				},
			},
		},
	});

	if (optionChoice?.optGroup.store.merchantId !== merchantId) {
		return null;
	}

	return optionChoice;
}
