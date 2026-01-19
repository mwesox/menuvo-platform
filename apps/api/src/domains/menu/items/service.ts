/**
 * Items Service
 *
 * Service facade for item operations.
 */

import type { Database } from "@menuvo/db";
import { categories, items } from "@menuvo/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { generateOrderKey, generateOrderKeys } from "../../../lib/ordering.js";
import {
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from "../../errors.js";
import type { IItemsService } from "./interface.js";
import type { CreateItemInput, UpdateItemInput } from "./types.js";
import {
	type IItemValidationService,
	type ItemValidationContext,
	ItemValidationService,
} from "./validation/index.js";

/**
 * Items service implementation
 */
export class ItemsService implements IItemsService {
	private readonly db: Database;
	private readonly validationService: IItemValidationService;

	constructor(db: Database) {
		this.db = db;
		this.validationService = new ItemValidationService();
	}

	/**
	 * Build validation context from category data
	 */
	private buildValidationContext(
		defaultLanguage: string,
		category: { defaultVatGroupId: string | null; isActive: boolean },
	): ItemValidationContext {
		return {
			defaultLanguage,
			categoryDefaultVatGroupId: category.defaultVatGroupId,
			categoryIsActive: category.isActive,
		};
	}

	async listByCategory(categoryId: string) {
		// Get the category first to get default VAT group and default language
		const category = await this.db.query.categories.findFirst({
			where: eq(categories.id, categoryId),
			with: {
				store: {
					with: {
						merchant: {
							columns: { supportedLanguages: true },
						},
					},
				},
			},
		});

		if (!category) {
			throw new NotFoundError("Category not found");
		}

		const defaultLanguage =
			category.store.merchant.supportedLanguages[0] ?? "de";

		const itemsData = await this.db.query.items.findMany({
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

		// Add validation to each item
		const validationContext = this.buildValidationContext(
			defaultLanguage,
			category,
		);

		return itemsData.map((item) => {
			const validation = this.validationService.validate(
				{
					translations: item.translations,
					vatGroupId: item.vatGroupId,
					categoryId: item.categoryId,
					price: item.price,
					imageUrl: item.imageUrl,
					isActive: item.isActive,
				},
				validationContext,
			);

			return { ...item, validation };
		});
	}

	async listByStore(storeId: string, defaultLanguage: string) {
		const itemsData = await this.db.query.items.findMany({
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

		// Add validation to each item
		return itemsData.map((item) => {
			const validationContext = this.buildValidationContext(
				defaultLanguage,
				item.category,
			);

			const validation = this.validationService.validate(
				{
					translations: item.translations,
					vatGroupId: item.vatGroupId,
					categoryId: item.categoryId,
					price: item.price,
					imageUrl: item.imageUrl,
					isActive: item.isActive,
				},
				validationContext,
			);

			return { ...item, validation };
		});
	}

	async getById(itemId: string, defaultLanguage: string) {
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

		// Add validation
		const validationContext = this.buildValidationContext(
			defaultLanguage,
			item.category,
		);

		const validation = this.validationService.validate(
			{
				translations: item.translations,
				vatGroupId: item.vatGroupId,
				categoryId: item.categoryId,
				price: item.price,
				imageUrl: item.imageUrl,
				isActive: item.isActive,
			},
			validationContext,
		);

		return { ...item, validation };
	}

	async create(storeId: string, input: CreateItemInput) {
		// Get last item's order key for fractional indexing
		const lastItem = await this.db.query.items.findFirst({
			where: eq(items.categoryId, input.categoryId),
			orderBy: [desc(items.displayOrder)],
			columns: { displayOrder: true },
		});
		const displayOrder = generateOrderKey(lastItem?.displayOrder ?? null);

		const [newItem] = await this.db
			.insert(items)
			.values({
				storeId,
				categoryId: input.categoryId,
				translations: input.translations,
				price: input.price,
				imageUrl: input.imageUrl ?? null,
				isActive: input.isActive ?? true,
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
		if (input.isActive !== undefined) updateData.isActive = input.isActive;
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

		// Generate new fractional keys for all items in new order
		const orderKeys = generateOrderKeys(null, itemIds.length);

		// Update display order for each item in a transaction for atomicity
		await this.db.transaction(async (tx) => {
			for (let i = 0; i < itemIds.length; i++) {
				const itemId = itemIds[i];
				const orderKey = orderKeys[i];
				if (!itemId || !orderKey) continue;
				await tx
					.update(items)
					.set({ displayOrder: orderKey })
					.where(eq(items.id, itemId));
			}
		});

		return { success: true };
	}

	async toggleActive(itemId: string, merchantId: string, isActive: boolean) {
		// If trying to activate, validate the item first
		if (isActive) {
			const item = await this.db.query.items.findFirst({
				where: eq(items.id, itemId),
				with: {
					category: true,
					store: {
						with: {
							merchant: {
								columns: { supportedLanguages: true },
							},
						},
					},
				},
			});

			if (!item) {
				throw new NotFoundError("Item not found");
			}

			const defaultLanguage = item.store.merchant.supportedLanguages[0] ?? "de";

			const validationContext = this.buildValidationContext(
				defaultLanguage,
				item.category,
			);

			const validation = this.validationService.validate(
				{
					translations: item.translations,
					vatGroupId: item.vatGroupId,
					categoryId: item.categoryId,
					price: item.price,
					imageUrl: item.imageUrl,
					isActive: item.isActive,
				},
				validationContext,
			);

			if (!validation.isPublishable) {
				throw new ValidationError(
					"Cannot activate item with validation warnings",
				);
			}
		}

		const updateInput: UpdateItemInput = { isActive };
		return this.update(itemId, merchantId, updateInput);
	}
}
