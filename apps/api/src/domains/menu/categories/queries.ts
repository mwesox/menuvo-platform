/**
 * Category Query Utilities
 *
 * Query builders for category operations.
 * These are pure query functions that return raw DB data.
 */

import type { Database } from "@menuvo/db";
import type { CategoryAvailabilitySchedule } from "@menuvo/db/schema";
import { categories, stores } from "@menuvo/db/schema";
import { asc, eq } from "drizzle-orm";

/**
 * Find categories by store ID with items (for list view)
 * Returns categories ordered by displayOrder with basic item info
 */
export async function findCategoriesByStoreId(db: Database, storeId: string) {
	return db.query.categories.findMany({
		where: eq(categories.storeId, storeId),
		orderBy: [asc(categories.displayOrder)],
		with: {
			items: {
				columns: {
					id: true,
					isActive: true,
					imageUrl: true,
				},
			},
		},
	});
}

/**
 * Find category by ID with items (for detail view)
 * Returns category with detailed item information
 */
export async function findCategoryById(db: Database, categoryId: string) {
	return db.query.categories.findFirst({
		where: eq(categories.id, categoryId),
		with: {
			items: {
				columns: {
					id: true,
					translations: true,
					price: true,
					imageUrl: true,
					isActive: true,
				},
			},
		},
	});
}

/**
 * Find store by ID with merchantId (for ownership checks)
 * Returns store with only merchantId column
 */
export async function findStoreById(db: Database, storeId: string) {
	return db.query.stores.findFirst({
		where: eq(stores.id, storeId),
		columns: { merchantId: true },
	});
}

/**
 * Find the last category's order key for fractional indexing
 * Returns only displayOrder column of the last category (by order)
 */
export async function findLastCategoryOrder(db: Database, storeId: string) {
	return db.query.categories.findFirst({
		where: eq(categories.storeId, storeId),
		orderBy: (categories, { desc }) => [desc(categories.displayOrder)],
		columns: { displayOrder: true },
	});
}

/**
 * Insert a new category
 * Returns the created category
 */
export async function insertCategory(
	db: Database,
	data: {
		storeId: string;
		translations: Record<string, { name: string; description?: string }>;
		displayOrder: string;
		isActive: boolean;
		defaultVatGroupId?: string | null;
		availabilitySchedule?: CategoryAvailabilitySchedule | null;
	},
) {
	const [newCategory] = await db
		.insert(categories)
		.values({
			storeId: data.storeId,
			translations: data.translations,
			displayOrder: data.displayOrder,
			isActive: data.isActive,
			defaultVatGroupId: data.defaultVatGroupId ?? null,
			availabilitySchedule: data.availabilitySchedule ?? null,
		})
		.returning();

	return newCategory;
}

/**
 * Find category by ID with store relation (for ownership checks)
 * Returns category with store.merchantId
 */
export async function findCategoryWithStore(db: Database, categoryId: string) {
	return db.query.categories.findFirst({
		where: eq(categories.id, categoryId),
		with: {
			store: {
				columns: { merchantId: true },
			},
		},
	});
}

/**
 * Update category by ID
 * Returns the updated category
 */
export async function updateCategory(
	db: Database,
	categoryId: string,
	data: {
		translations?: Record<string, { name: string; description?: string }>;
		displayOrder?: string;
		isActive?: boolean;
		defaultVatGroupId?: string | null;
		availabilitySchedule?: CategoryAvailabilitySchedule | null;
	},
) {
	const [updatedCategory] = await db
		.update(categories)
		.set(data)
		.where(eq(categories.id, categoryId))
		.returning();

	return updatedCategory;
}

/**
 * Delete category by ID
 */
export async function deleteCategory(db: Database, categoryId: string) {
	await db.delete(categories).where(eq(categories.id, categoryId));
}

/**
 * Find category IDs by store ID (for reorder validation)
 * Returns only category IDs
 */
export async function findCategoryIdsByStoreId(db: Database, storeId: string) {
	return db.query.categories.findMany({
		where: eq(categories.storeId, storeId),
		columns: { id: true },
	});
}

/**
 * Reorder categories in a transaction
 * Updates displayOrder for multiple categories atomically
 */
export async function reorderCategoriesInTransaction(
	db: Database,
	updates: Array<{ categoryId: string; displayOrder: string }>,
) {
	await db.transaction(async (tx) => {
		const updatePromises = updates.map(({ categoryId, displayOrder }) =>
			tx
				.update(categories)
				.set({ displayOrder })
				.where(eq(categories.id, categoryId)),
		);
		await Promise.all(updatePromises);
	});
}
