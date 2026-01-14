/**
 * Shop Menu Service Interface
 *
 * Defines the contract for shop-facing menu operations.
 */

import type { MenuResponse } from "../schemas.js";

/**
 * Shop menu service interface
 */
export interface IShopMenuService {
	/**
	 * Get complete menu for shop frontend
	 * Returns store info, categories, and items in a single query
	 */
	getMenu(storeSlug: string, languageCode: string): Promise<MenuResponse>;

	/**
	 * Get item details with option groups for shop frontend
	 * Returns item with option groups and choices
	 */
	getItemDetails(
		itemId: string,
		languageCode: string,
	): Promise<{
		id: string;
		categoryId: string;
		name: string;
		description: string | null;
		price: number;
		imageUrl: string | null;
		allergens: string[] | null;
		displayOrder: number;
		optionGroups: Array<{
			id: string;
			name: string;
			description: string | null;
			type: string;
			isRequired: boolean;
			minSelections: number | null;
			maxSelections: number | null;
			numFreeOptions: number | null;
			aggregateMinQuantity: number | null;
			aggregateMaxQuantity: number | null;
			displayOrder: number;
			choices: Array<{
				id: string;
				name: string;
				priceModifier: number;
				isDefault: boolean;
				isAvailable: boolean;
				minQuantity: number | null;
				maxQuantity: number | null;
				displayOrder: number;
			}>;
		}>;
		store: {
			id: string;
			slug: string;
			name: string;
			currency: string;
		};
	}>;
}
