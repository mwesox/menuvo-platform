/**
 * Categories Service
 *
 * Service facade for category operations.
 */

import type { Database } from "@menuvo/db";
import type { CategoryAvailabilitySchedule } from "@menuvo/db/schema";
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
 * Check if a category is currently available based on its schedule
 */
export function isCategoryAvailable(
	schedule: CategoryAvailabilitySchedule | null,
	now: Date,
	storeTimezone: string,
): boolean {
	// No schedule or schedule disabled = always available
	if (!schedule || !schedule.enabled) {
		return true;
	}

	// Check date range (if specified)
	if (schedule.dateRange) {
		const today = new Date(
			new Intl.DateTimeFormat("en-CA", {
				timeZone: storeTimezone || "UTC",
			}).format(now),
		);
		const startDate = new Date(schedule.dateRange.startDate);
		const endDate = new Date(schedule.dateRange.endDate);

		// Set time to start of day for comparison
		today.setHours(0, 0, 0, 0);
		startDate.setHours(0, 0, 0, 0);
		endDate.setHours(0, 0, 0, 0);

		if (today < startDate || today > endDate) {
			return false;
		}
	}

	// Check day of week (if specified)
	if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
		const dayOfWeekInTz = new Intl.DateTimeFormat("en-US", {
			timeZone: storeTimezone || "UTC",
			weekday: "long",
		}).format(now);
		const dayName = dayOfWeekInTz.toLowerCase();

		if (
			!schedule.daysOfWeek.includes(
				dayName as (typeof schedule.daysOfWeek)[number],
			)
		) {
			return false;
		}
	}

	// Check time range (if specified)
	if (schedule.timeRange) {
		const currentTime = new Intl.DateTimeFormat("en-US", {
			timeZone: storeTimezone || "UTC",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		}).format(now);

		const startTime = schedule.timeRange.startTime;
		const endTime = schedule.timeRange.endTime;

		// Handle midnight crossover (e.g., 22:00-02:00)
		if (startTime > endTime) {
			// Crossover: visible from startTime today until endTime tomorrow
			if (currentTime >= startTime || currentTime < endTime) {
				return true;
			}
			return false;
		} else {
			// Normal range: visible from startTime to endTime on same day
			if (currentTime >= startTime && currentTime < endTime) {
				return true;
			}
			return false;
		}
	}

	// All checks passed
	return true;
}

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
			availabilitySchedule: input.availabilitySchedule ?? null,
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
			availabilitySchedule?: CategoryAvailabilitySchedule | null;
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
		if (input.availabilitySchedule !== undefined) {
			updateData.availabilitySchedule = input.availabilitySchedule;
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
		const updates = categoryIds.map((categoryId, index) => {
			const displayOrder = orderKeys[index];
			if (!displayOrder) {
				throw new Error(`Missing order key at index ${index}`);
			}
			return { categoryId, displayOrder };
		});

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
