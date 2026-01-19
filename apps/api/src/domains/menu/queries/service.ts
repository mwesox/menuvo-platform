/**
 * Menu Query Service
 *
 * Implements cross-domain read operations for menu data.
 * Orchestrates categories and items queries with optional validation.
 * Single entry point for ALL reads - both admin and shop.
 */

import type { Database } from "@menuvo/db";
import { categories, items } from "@menuvo/db/schema";
import { asc, eq } from "drizzle-orm";
import { NotFoundError } from "../../errors.js";
import type { IItemsService } from "../items/interface.js";
import {
	type ItemValidationContext,
	ItemValidationService,
} from "../items/validation/index.js";
import type { MenuResponse } from "../schemas.js";
import { normalizeLanguageCode } from "../utils.js";
import type {
	CategoryWithItems,
	IMenuQueryService,
	ShopItemDetails,
} from "./interface.js";
import {
	getItemDetailsDataForShop,
	getMenuDataForShop,
} from "./shop-queries.js";
import {
	transformItemDetailsToShop,
	transformMenuToShop,
} from "./shop-transforms.js";

export class MenuQueryService implements IMenuQueryService {
	private readonly validationService = new ItemValidationService();

	constructor(
		private readonly db: Database,
		private readonly itemsService: IItemsService,
	) {}

	// ============================================================================
	// ADMIN QUERIES (authenticated)
	// ============================================================================

	async getCategories(
		storeId: string,
		defaultLanguage: string,
	): Promise<CategoryWithItems[]> {
		// Single optimized query: categories with items using Drizzle relational API
		const categoriesData = await this.db.query.categories.findMany({
			where: eq(categories.storeId, storeId),
			orderBy: [asc(categories.displayOrder)],
			with: {
				items: {
					orderBy: [asc(items.displayOrder)],
				},
			},
		});

		// Transform with validation (in-memory, using category context)
		return categoriesData.map((cat) => {
			const validationContext: ItemValidationContext = {
				defaultLanguage,
				categoryDefaultVatGroupId: cat.defaultVatGroupId,
				categoryIsActive: cat.isActive,
			};

			return {
				id: cat.id,
				storeId: cat.storeId,
				translations: cat.translations,
				displayOrder: cat.displayOrder,
				isActive: cat.isActive,
				defaultVatGroupId: cat.defaultVatGroupId,
				createdAt: cat.createdAt,
				updatedAt: cat.updatedAt,
				items: cat.items.map((item) => ({
					id: item.id,
					isActive: item.isActive,
					imageUrl: item.imageUrl,
					translations: item.translations,
					price: item.price,
					validation: this.validationService.validate(
						{
							translations: item.translations,
							vatGroupId: item.vatGroupId,
							categoryId: item.categoryId,
							price: item.price,
							imageUrl: item.imageUrl,
							isActive: item.isActive,
						},
						validationContext,
					),
				})),
			};
		});
	}

	async getCategory(categoryId: string): Promise<CategoryWithItems | null> {
		// Single optimized query: category with items and merchant for language
		const category = await this.db.query.categories.findFirst({
			where: eq(categories.id, categoryId),
			with: {
				items: {
					orderBy: [asc(items.displayOrder)],
				},
				store: {
					with: {
						merchant: {
							columns: { supportedLanguages: true },
						},
					},
				},
			},
		});

		if (!category) return null;

		const defaultLanguage =
			category.store.merchant.supportedLanguages?.[0] ?? "de";

		const validationContext: ItemValidationContext = {
			defaultLanguage,
			categoryDefaultVatGroupId: category.defaultVatGroupId,
			categoryIsActive: category.isActive,
		};

		return {
			id: category.id,
			storeId: category.storeId,
			translations: category.translations,
			displayOrder: category.displayOrder,
			isActive: category.isActive,
			defaultVatGroupId: category.defaultVatGroupId,
			createdAt: category.createdAt,
			updatedAt: category.updatedAt,
			items: category.items.map((item) => ({
				id: item.id,
				isActive: item.isActive,
				imageUrl: item.imageUrl,
				translations: item.translations,
				price: item.price,
				validation: this.validationService.validate(
					{
						translations: item.translations,
						vatGroupId: item.vatGroupId,
						categoryId: item.categoryId,
						price: item.price,
						imageUrl: item.imageUrl,
						isActive: item.isActive,
					},
					validationContext,
				),
			})),
		};
	}

	// ============================================================================
	// SHOP QUERIES (public, active-only)
	// ============================================================================

	async getShopMenu(
		storeSlug: string,
		languageCode: string,
	): Promise<MenuResponse> {
		const store = await getMenuDataForShop(this.db, storeSlug);

		if (!store) {
			throw new NotFoundError("Store not found");
		}

		const validatedCode = this.validateLanguageCode(
			languageCode,
			store.merchant?.supportedLanguages ?? ["de"],
		);

		return transformMenuToShop(store, validatedCode);
	}

	async getShopItemDetails(
		itemId: string,
		languageCode: string,
	): Promise<ShopItemDetails> {
		const result = await getItemDetailsDataForShop(this.db, itemId);

		if (
			!result ||
			!result.item.store.isActive ||
			!result.item.category.isActive
		) {
			throw new NotFoundError("Item not found");
		}

		const validatedCode = this.validateLanguageCode(
			languageCode,
			result.item.store.merchant?.supportedLanguages ?? ["de"],
		);

		return transformItemDetailsToShop(
			result.item,
			result.itemOptGroups,
			validatedCode,
		);
	}

	/**
	 * Validate and normalize language code against supported languages
	 */
	private validateLanguageCode(
		code: string,
		supportedLanguages: string[],
	): string {
		const normalizedCode = normalizeLanguageCode(code);
		return supportedLanguages.includes(normalizedCode)
			? normalizedCode
			: (supportedLanguages[0] ?? "de");
	}
}
