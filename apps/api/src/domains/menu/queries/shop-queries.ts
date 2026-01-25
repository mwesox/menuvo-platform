/**
 * Shop Query Utilities
 *
 * Query builders for shop frontend.
 * These are utilities, not a feature service.
 */

import type { Database } from "@menuvo/db";
import {
	categories,
	itemOptionGroups,
	items,
	optionChoices,
	stores,
} from "@menuvo/db/schema";
import { and, asc, eq } from "drizzle-orm";

/**
 * Get store with categories and items for shop menu
 * Returns raw DB data with relations
 */
export async function getMenuDataForShop(db: Database, storeSlug: string) {
	return db.query.stores.findFirst({
		where: and(eq(stores.slug, storeSlug), eq(stores.isActive, true)),
		with: {
			merchant: {
				columns: {
					paypalPaymentsReceivable: true,
					supportedLanguages: true,
				},
			},
			settings: true,
			categories: {
				where: eq(categories.isActive, true),
				orderBy: [asc(categories.displayOrder)],
				with: {
					items: {
						where: eq(items.isActive, true),
						orderBy: [asc(items.displayOrder)],
						with: {
							optGroups: true,
						},
					},
				},
			},
		},
	});
}

/**
 * Get item with option groups for shop item details
 * Returns raw DB data or null if not found
 */
export async function getItemDetailsDataForShop(db: Database, itemId: string) {
	const item = await db.query.items.findFirst({
		where: and(eq(items.id, itemId), eq(items.isActive, true)),
		with: {
			store: {
				columns: {
					id: true,
					slug: true,
					name: true,
					isActive: true,
					currency: true,
				},
				with: {
					merchant: {
						columns: {
							supportedLanguages: true,
						},
					},
				},
			},
			category: {
				columns: {
					id: true,
					isActive: true,
				},
			},
		},
	});

	if (!item) return null;

	const itemOptGroups = await db.query.itemOptionGroups.findMany({
		where: eq(itemOptionGroups.itemId, itemId),
		orderBy: [asc(itemOptionGroups.displayOrder)],
		with: {
			optGroup: {
				with: {
					choices: {
						where: eq(optionChoices.isAvailable, true),
						orderBy: [asc(optionChoices.displayOrder)],
					},
				},
			},
		},
	});

	return { item, itemOptGroups };
}
