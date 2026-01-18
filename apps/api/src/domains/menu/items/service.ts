/**
 * Items Service
 *
 * Service facade for item operations.
 */

import type { Database } from "@menuvo/db";
import { categories, items } from "@menuvo/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from "../../errors.js";
import type { IItemsService } from "./interface.js";
import type { CreateItemInput, UpdateItemInput } from "./types.js";

/**
 * Items service implementation
 */
export class ItemsService implements IItemsService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async listByCategory(categoryId: string) {
		return this.db.query.items.findMany({
			where: eq(items.categoryId, categoryId),
			orderBy: [asc(items.displayOrder), asc(items.createdAt)],
			with: {
				optGroups: {
					with: {
						optGroup: {
							with: {
								choices: true,
							},
						},
					},
					orderBy: (iog, { asc }) => [asc(iog.displayOrder)],
				},
			},
		});
	}

	async listByStore(storeId: string) {
		return this.db.query.items.findMany({
			where: eq(items.storeId, storeId),
			orderBy: [asc(items.displayOrder), asc(items.createdAt)],
			with: {
				category: true,
				optGroups: {
					with: {
						optGroup: {
							with: {
								choices: true,
							},
						},
					},
					orderBy: (iog, { asc }) => [asc(iog.displayOrder)],
				},
			},
		});
	}

	async getById(itemId: string) {
		const item = await this.db.query.items.findFirst({
			where: eq(items.id, itemId),
			with: {
				category: true,
				store: true,
				optGroups: {
					with: {
						optGroup: {
							with: {
								choices: true,
							},
						},
					},
					orderBy: (iog, { asc }) => [asc(iog.displayOrder)],
				},
			},
		});

		if (!item) {
			throw new NotFoundError("Item not found");
		}

		return item;
	}

	async create(storeId: string, input: CreateItemInput) {
		// Get max displayOrder if not provided
		let displayOrder = input.displayOrder;
		if (displayOrder === undefined) {
			const existingItems = await this.db.query.items.findMany({
				where: eq(items.categoryId, input.categoryId),
				columns: { displayOrder: true },
			});
			const maxOrder = existingItems.reduce(
				(max, item) => Math.max(max, item.displayOrder),
				-1,
			);
			displayOrder = maxOrder + 1;
		}

		const [newItem] = await this.db
			.insert(items)
			.values({
				storeId,
				categoryId: input.categoryId,
				translations: input.translations,
				price: input.price,
				imageUrl: input.imageUrl ?? null,
				isAvailable: input.isAvailable ?? true,
				displayOrder,
				allergens: input.allergens ?? [],
				kitchenName: input.kitchenName ?? null,
				vatGroupId: input.vatGroupId ?? null,
			})
			.returning();

		if (!newItem) {
			throw new ValidationError("Failed to create item");
		}

		return newItem;
	}

	async update(itemId: string, merchantId: string, input: UpdateItemInput) {
		// Verify ownership via category -> store
		const existingItem = await this.db.query.items.findFirst({
			where: eq(items.id, itemId),
			with: {
				category: {
					with: {
						store: {
							columns: { merchantId: true },
						},
					},
				},
			},
		});

		if (!existingItem) {
			throw new NotFoundError("Item not found");
		}

		if (existingItem.category.store.merchantId !== merchantId) {
			throw new ForbiddenError(
				"You do not have permission to update this item",
			);
		}

		// Build update object with only defined fields
		const updateData: Record<string, unknown> = {};
		if (input.categoryId !== undefined)
			updateData.categoryId = input.categoryId;
		if (input.translations !== undefined)
			updateData.translations = input.translations;
		if (input.price !== undefined) updateData.price = input.price;
		if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
		if (input.isAvailable !== undefined)
			updateData.isAvailable = input.isAvailable;
		if (input.displayOrder !== undefined)
			updateData.displayOrder = input.displayOrder;
		if (input.allergens !== undefined) updateData.allergens = input.allergens;
		if (input.kitchenName !== undefined)
			updateData.kitchenName = input.kitchenName;
		if (input.vatGroupId !== undefined)
			updateData.vatGroupId = input.vatGroupId;

		if (Object.keys(updateData).length === 0) {
			return existingItem;
		}

		const [updatedItem] = await this.db
			.update(items)
			.set(updateData)
			.where(eq(items.id, itemId))
			.returning();

		if (!updatedItem) {
			throw new ValidationError("Failed to update item");
		}

		return updatedItem;
	}

	async delete(itemId: string, merchantId: string): Promise<void> {
		// Verify ownership via category -> store
		const existingItem = await this.db.query.items.findFirst({
			where: eq(items.id, itemId),
			with: {
				category: {
					with: {
						store: {
							columns: { merchantId: true },
						},
					},
				},
			},
		});

		if (!existingItem) {
			throw new NotFoundError("Item not found");
		}

		if (existingItem.category.store.merchantId !== merchantId) {
			throw new ForbiddenError(
				"You do not have permission to delete this item",
			);
		}

		await this.db.delete(items).where(eq(items.id, itemId));
	}

	async reorder(
		categoryId: string,
		itemIds: string[],
	): Promise<{ success: boolean }> {
		// Get category to verify it exists and get storeId
		const category = await this.db.query.categories.findFirst({
			where: eq(categories.id, categoryId),
			columns: { id: true, storeId: true },
		});

		if (!category) {
			throw new NotFoundError("Category not found");
		}

		// Verify all items belong to this category
		const existingItems = await this.db.query.items.findMany({
			where: and(
				inArray(items.id, itemIds),
				eq(items.categoryId, categoryId),
				eq(items.storeId, category.storeId),
			),
			columns: { id: true },
		});

		if (existingItems.length !== itemIds.length) {
			throw new ValidationError(
				"Some items do not exist or do not belong to this category",
			);
		}

		// Update display order for each item in a transaction for atomicity
		await this.db.transaction(async (tx) => {
			for (let i = 0; i < itemIds.length; i++) {
				const itemId = itemIds[i];
				if (!itemId) continue;
				await tx
					.update(items)
					.set({ displayOrder: i })
					.where(eq(items.id, itemId));
			}
		});

		return { success: true };
	}

	async toggleAvailability(
		itemId: string,
		merchantId: string,
		isAvailable: boolean,
	) {
		const updateInput: UpdateItemInput = { isAvailable };
		return this.update(itemId, merchantId, updateInput);
	}
}
