import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
	categories,
	items,
	optionChoices,
	optionGroups,
	stores,
} from "@/db/schema";

/**
 * Ownership helpers for entities that need related data (e.g., translations).
 * These are kept separate from auth-middleware.ts to avoid db imports leaking
 * to client bundle when middleware is imported.
 */

// ============================================================================
// SIMPLE STORE OWNERSHIP VALIDATION
// ============================================================================

/**
 * Helper to validate store ownership.
 * Use in server function handlers after withAuth middleware.
 *
 * Usage:
 * ```ts
 * export const getCategories = createServerFn({ method: "GET" })
 *   .middleware([withAuth])
 *   .inputValidator(z.object({ storeId: z.string().uuid() }))
 *   .handler(async ({ context, data }) => {
 *     const store = await requireStoreOwnership(data.storeId, context.auth.merchantId);
 *     // ...
 *   });
 * ```
 */
export async function requireStoreOwnership(
	storeId: string,
	merchantId: string,
) {
	const store = await db.query.stores.findFirst({
		where: and(eq(stores.id, storeId), eq(stores.merchantId, merchantId)),
	});
	if (!store) {
		throw new Error("Store not found or access denied");
	}
	return store;
}

// ============================================================================
// STORE WITH OWNERSHIP DATA
// ============================================================================

/**
 * Gets a store if it belongs to the merchant, including merchant data.
 * Returns store with merchant data for translations support.
 */
export async function getStoreWithMerchant(
	storeId: string,
	merchantId: string,
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
// CATEGORY WITH OWNERSHIP DATA
// ============================================================================

/**
 * Gets a category if it belongs to the merchant (via store).
 * Returns category with store and merchant data for translations support.
 */
export async function getCategoryWithOwnership(
	categoryId: string,
	merchantId: string,
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
// ITEM WITH OWNERSHIP DATA
// ============================================================================

/**
 * Gets an item if it belongs to the merchant (via store).
 * Returns item with store and merchant data for translations support.
 */
export async function getItemWithOwnership(itemId: string, merchantId: string) {
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
// OPTION GROUP WITH OWNERSHIP DATA
// ============================================================================

/**
 * Gets an option group if it belongs to the merchant (via store).
 * Returns option group with store and merchant data for translations support.
 */
export async function getOptionGroupWithOwnership(
	optionGroupId: string,
	merchantId: string,
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
// OPTION CHOICE WITH OWNERSHIP DATA
// ============================================================================

/**
 * Gets an option choice if it belongs to the merchant (via option group -> store).
 * Returns option choice with store and merchant data for translations support.
 */
export async function getOptionChoiceWithOwnership(
	optionChoiceId: string,
	merchantId: string,
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
