/**
 * Shop Menu Service
 *
 * Service facade for shop-facing menu operations.
 */

import type { Database } from "@menuvo/db";
import { NotFoundError } from "../../errors.js";
import { normalizeLanguageCode } from "../utils.js";
import type { IShopMenuService } from "./interface.js";
import { getItemDetailsDataForShop, getMenuDataForShop } from "./queries.js";
import {
	transformItemDetailsToShop,
	transformMenuToShop,
} from "./transforms.js";

/**
 * Shop menu service implementation
 */
export class ShopMenuService implements IShopMenuService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getMenu(storeSlug: string, languageCode: string) {
		const store = await getMenuDataForShop(this.db, storeSlug);

		if (!store) {
			throw new NotFoundError("Store not found");
		}

		// Normalize browser language code (e.g., "en-US" -> "en")
		const normalizedCode = normalizeLanguageCode(languageCode);

		// Get merchant's supported languages
		const supportedLanguages = store.merchant?.supportedLanguages ?? ["de"];

		// Validate normalized code is in supported languages
		// If not, use first supported language as fallback
		const validatedCode = supportedLanguages.includes(normalizedCode)
			? normalizedCode
			: (supportedLanguages[0] ?? "de");

		return transformMenuToShop(store, validatedCode);
	}

	async getItemDetails(itemId: string, languageCode: string) {
		const result = await getItemDetailsDataForShop(this.db, itemId);

		if (
			!result ||
			!result.item.store.isActive ||
			!result.item.category.isActive
		) {
			throw new NotFoundError("Item not found");
		}

		// Normalize browser language code (e.g., "en-US" -> "en")
		const normalizedCode = normalizeLanguageCode(languageCode);

		// Get merchant's supported languages
		const supportedLanguages = result.item.store.merchant
			?.supportedLanguages ?? ["de"];

		// Validate normalized code is in supported languages
		// If not, use first supported language as fallback
		const validatedCode = supportedLanguages.includes(normalizedCode)
			? normalizedCode
			: (supportedLanguages[0] ?? "de");

		return transformItemDetailsToShop(
			result.item,
			result.itemOptGroups,
			validatedCode,
		);
	}
}
