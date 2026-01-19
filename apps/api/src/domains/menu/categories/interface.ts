/**
 * Categories Service Interface
 *
 * Defines the contract for category operations.
 */

import type { categories, items } from "@menuvo/db/schema";
import type { CreateCategoryInput, UpdateCategoryInput } from "./types.js";

/**
 * Category item summary (minimal fields for list view)
 */
export type CategoryItemSummary = Pick<
	typeof items.$inferSelect,
	"id" | "isActive" | "imageUrl"
>;

/**
 * Category item detail (fields for detail view)
 */
export type CategoryItemDetail = Pick<
	typeof items.$inferSelect,
	"id" | "translations" | "price" | "imageUrl" | "isActive"
>;

/**
 * Categories service interface
 */
export interface ICategoriesService {
	list(
		storeId: string,
	): Promise<
		(typeof categories.$inferSelect & { items: CategoryItemSummary[] })[]
	>;
	getById(
		categoryId: string,
	): Promise<typeof categories.$inferSelect & { items: CategoryItemDetail[] }>;
	create(
		merchantId: string,
		input: CreateCategoryInput,
	): Promise<typeof categories.$inferSelect>;
	update(
		categoryId: string,
		merchantId: string,
		input: UpdateCategoryInput,
	): Promise<typeof categories.$inferSelect>;
	delete(categoryId: string, merchantId: string): Promise<void>;
	reorder(
		storeId: string,
		categoryIds: string[],
	): Promise<{ success: boolean }>;
	toggleActive(
		categoryId: string,
		merchantId: string,
		isActive: boolean,
	): Promise<typeof categories.$inferSelect>;
}
