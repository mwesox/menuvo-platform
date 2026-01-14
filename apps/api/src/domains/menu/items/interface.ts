/**
 * Items Service Interface
 *
 * Defines the contract for item operations.
 */

import type {
	categories,
	itemOptionGroups,
	items,
	optionChoices,
	optionGroups,
	stores,
} from "@menuvo/db/schema";
import type { CreateItemInput, UpdateItemInput } from "./types.js";

/**
 * Item option group relation (from junction table)
 */
export type ItemOptionGroupRelation = typeof itemOptionGroups.$inferSelect & {
	optGroup: typeof optionGroups.$inferSelect & {
		choices: (typeof optionChoices.$inferSelect)[];
	};
};

/**
 * Items service interface
 */
export interface IItemsService {
	listByCategory(
		categoryId: string,
	): Promise<
		(typeof items.$inferSelect & { optGroups: ItemOptionGroupRelation[] })[]
	>;
	listByStore(storeId: string): Promise<
		(typeof items.$inferSelect & {
			category: typeof categories.$inferSelect;
			optGroups: ItemOptionGroupRelation[];
		})[]
	>;
	getById(itemId: string): Promise<
		typeof items.$inferSelect & {
			category: typeof categories.$inferSelect;
			store: typeof stores.$inferSelect;
			optGroups: ItemOptionGroupRelation[];
		}
	>;
	create(
		storeId: string,
		input: CreateItemInput,
	): Promise<typeof items.$inferSelect>;
	update(
		itemId: string,
		merchantId: string,
		input: UpdateItemInput,
	): Promise<typeof items.$inferSelect>;
	delete(itemId: string, merchantId: string): Promise<void>;
	reorder(categoryId: string, itemIds: string[]): Promise<{ success: boolean }>;
	toggleAvailability(
		itemId: string,
		merchantId: string,
		isAvailable: boolean,
	): Promise<typeof items.$inferSelect>;
}
