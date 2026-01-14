/**
 * Categories Service
 *
 * Service facade for category operations.
 */

import type { Database } from "@menuvo/db";
import {
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from "../../errors.js";
import type { ICategoriesService } from "./interface.js";
import {
	deleteCategory,
	findCategoriesByStoreId,
	findCategoriesForOrdering,
	findCategoryById,
	findCategoryIdsByStoreId,
	findCategoryWithStore,
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

		// Get max displayOrder if not provided
		let displayOrder = input.displayOrder;
		if (displayOrder === undefined) {
			const existingCategories = await findCategoriesForOrdering(
				this.db,
				input.storeId,
			);
			const maxOrder = existingCategories.reduce(
				(max, cat) => Math.max(max, cat.displayOrder),
				-1,
			);
			displayOrder = maxOrder + 1;
		}

		const newCategory = await insertCategory(this.db, {
			storeId: input.storeId,
			translations: input.translations,
			displayOrder,
			isActive: input.isActive ?? true,
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
			displayOrder?: number;
			isActive?: boolean;
		} = {};
		if (input.translations !== undefined) {
			updateData.translations = input.translations;
		}
		if (input.displayOrder !== undefined) {
			updateData.displayOrder = input.displayOrder;
		}
		if (input.isActive !== undefined) {
			updateData.isActive = input.isActive;
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

		// Update displayOrder in a transaction
		const updates = categoryIds.map((categoryId, index) => ({
			categoryId,
			displayOrder: index,
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
