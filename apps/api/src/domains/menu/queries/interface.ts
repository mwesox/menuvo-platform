/**
 * Menu Query Service Interface
 *
 * Defines the contract for cross-domain menu read operations.
 * This layer orchestrates reads that span categories and items,
 * following CQRS-lite principles.
 *
 * CQRS-light: MenuQueryService = Single entry point for ALL reads (admin + shop)
 */

import type { EntityTranslations } from "@menuvo/db/schema";
import type { ItemValidationResult } from "../items/validation/index.js";
import type { MenuResponse } from "../schemas.js";

/**
 * Category item with validation info
 */
export interface CategoryItem {
	id: string;
	isActive: boolean;
	imageUrl: string | null;
	translations: EntityTranslations;
	price: number;
	validation: ItemValidationResult;
}

/**
 * Category with items (includes validation)
 */
export interface CategoryWithItems {
	id: string;
	storeId: string;
	translations: EntityTranslations;
	displayOrder: string;
	isActive: boolean;
	defaultVatGroupId: string | null;
	createdAt: Date;
	updatedAt: Date;
	items: CategoryItem[];
}

/**
 * Shop item details return type
 */
export interface ShopItemDetails {
	id: string;
	categoryId: string;
	name: string;
	description: string | null;
	price: number;
	imageUrl: string | null;
	allergens: string[] | null;
	displayOrder: string;
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
		displayOrder: string;
		choices: Array<{
			id: string;
			name: string;
			priceModifier: number;
			isDefault: boolean;
			isAvailable: boolean;
			minQuantity: number | null;
			maxQuantity: number | null;
			displayOrder: string;
		}>;
	}>;
	store: {
		id: string;
		slug: string;
		name: string;
		currency: string;
	};
}

/**
 * Menu Query Service Interface
 *
 * Provides optimized read operations that span multiple menu domains.
 * Single entry point for ALL reads - both admin and shop.
 */
export interface IMenuQueryService {
	// ============================================================================
	// ADMIN QUERIES (authenticated)
	// ============================================================================

	/**
	 * Get categories with items and validation
	 */
	getCategories(
		storeId: string,
		defaultLanguage: string,
	): Promise<CategoryWithItems[]>;

	/**
	 * Get a single category with items
	 */
	getCategory(categoryId: string): Promise<CategoryWithItems | null>;

	// ============================================================================
	// SHOP QUERIES (public, active-only)
	// ============================================================================

	/**
	 * Get complete menu for shop frontend
	 * Returns store info, categories, and items in a single query.
	 * Only returns active stores, categories, and items.
	 */
	getShopMenu(storeSlug: string, languageCode: string): Promise<MenuResponse>;

	/**
	 * Get item details with option groups for shop frontend
	 * Returns item with option groups and choices.
	 * Only returns active items from active stores.
	 */
	getShopItemDetails(
		itemId: string,
		languageCode: string,
	): Promise<ShopItemDetails>;
}
