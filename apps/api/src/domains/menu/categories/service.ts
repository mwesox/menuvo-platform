/**
 * Categories Service
 *
 * Service facade for category operations.
 */

import type { Database } from "@menuvo/db";
import { generateOrderKey, generateOrderKeys } from "../../../lib/ordering.js";
import {
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from "../../errors.js";
import type { ICategoriesService } from "./interface.js";
import {
	deleteCategory,
	findCategoriesByStoreId,
	findCategoryById,
	findCategoryIdsByStoreId,
	findCategoryWithStore,
	findLastCategoryOrder,
	findStoreById,
	insertCategory,
	reorderCategoriesInTransaction,
	updateCategory,
} from "./queries.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./types.js";

/**
 * Categories service implementation
 */
export class CategoriesService implements ICategoriesService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async list(storeId: string) {
		return findCategoriesByStoreId(this.db, storeId);
	}

	async getById(categoryId: string) {
		const category = await findCategoryById(this.db, categoryId);

		if (!category) {
			throw new NotFoundError("Category not found");
		}

		return category;
	}

	async create(merchantId: string, input: CreateCategoryInput) {
		// Verify store ownership
		const store = await findStoreById(this.db, input.storeId);

		if (!store || store.merchantId !== merchantId) {
			throw new ForbiddenError(
				"You do not have permission to create categories for this store",
			);
		}

		// Get last category's order key for fractional indexing
		const lastCategory = await findLastCategoryOrder(this.db, input.storeId);
		const displayOrder = generateOrderKey(lastCategory?.displayOrder ?? null);

		const newCategory = await insertCategory(this.db, {
			storeId: input.storeId,
			translations: input.translations,
			displayOrder,
			isActive: input.isActive ?? true,
			defaultVatGroupId: input.defaultVatGroupId ?? null,
		});

		if (!newCategory) {
			throw new ValidationError("Failed to create category");
		}

		return newCategory;
	}

	async update(
		categoryId: string,
		merchantId: string,
		input: UpdateCategoryInput,
	) {
		// Verify ownership via store
		const existingCategory = await findCategoryWithStore(this.db, categoryId);

		if (!existingCategory) {
			throw new NotFoundError("Category not found");
		}

		if (existingCategory.store.merchantId !== merchantId) {
			throw new ForbiddenError(
				"You do not have permission to update this category",
			);
		}

		// Build update object with only defined fields
		const updateData: {
			translations?: Record<string, { name: string; description?: string }>;
			displayOrder?: string;
			isActive?: boolean;
			defaultVatGroupId?: string | null;
		} = {};
		if (input.translations !== undefined) {
			updateData.translations = input.translations;
		}
		// Note: displayOrder from input is ignored - use reorder() for ordering changes
		if (input.isActive !== undefined) {
			updateData.isActive = input.isActive;
		}
		if (input.defaultVatGroupId !== undefined) {
			updateData.defaultVatGroupId = input.defaultVatGroupId;
		}

		if (Object.keys(updateData).length === 0) {
			return existingCategory;
		}

		const updatedCategory = await updateCategory(
			this.db,
			categoryId,
			updateData,
		);

		if (!updatedCategory) {
			throw new ValidationError("Failed to update category");
		}

		return updatedCategory;
	}

	async delete(categoryId: string, merchantId: string): Promise<void> {
		// Verify ownership via store
		const existingCategory = await findCategoryWithStore(this.db, categoryId);

		if (!existingCategory) {
			throw new NotFoundError("Category not found");
		}

		if (existingCategory.store.merchantId !== merchantId) {
			throw new ForbiddenError(
				"You do not have permission to delete this category",
			);
		}

		await deleteCategory(this.db, categoryId);
	}

	async reorder(storeId: string, categoryIds: string[]) {
		// Verify all categories belong to the store
		const existingCategories = await findCategoryIdsByStoreId(this.db, storeId);

		const existingIds = new Set(existingCategories.map((c) => c.id));
		const invalidIds = categoryIds.filter((id) => !existingIds.has(id));

		if (invalidIds.length > 0) {
			throw new ValidationError(
				`Categories not found in store: ${invalidIds.join(", ")}`,
			);
		}

		// Generate new fractional keys for all categories in new order
		const orderKeys = generateOrderKeys(null, categoryIds.length);
		const updates = categoryIds.map((categoryId, index) => ({
			categoryId,
			displayOrder: orderKeys[index]!,
		}));

		await reorderCategoriesInTransaction(this.db, updates);

		return { success: true };
	}

	async toggleActive(
		categoryId: string,
		merchantId: string,
		isActive: boolean,
	) {
		const updateInput: UpdateCategoryInput = { isActive };
		return this.update(categoryId, merchantId, updateInput);
	}
}
