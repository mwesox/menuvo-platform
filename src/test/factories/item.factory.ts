/**
 * Factory for creating test menu items.
 */

import { type EntityTranslations, items } from "@/db/schema";
import { testDb } from "../db";
import { uniqueId } from "../utils/test-id";

export interface ItemFactoryOptions {
	testRunId: string;
	categoryId: number;
	storeId: number;
	translations?: EntityTranslations;
	price?: number;
	displayOrder?: number;
	isAvailable?: boolean;
	allergens?: string[];
}

export async function createTestItem(options: ItemFactoryOptions) {
	const {
		testRunId,
		categoryId,
		storeId,
		translations,
		price = 999, // 9.99 EUR in cents
		displayOrder = 0,
		isAvailable = true,
		allergens,
	} = options;

	const defaultTranslations: EntityTranslations = {
		de: { name: `Test Artikel ${uniqueId(testRunId)}`, description: "" },
		en: { name: `Test Item ${uniqueId(testRunId)}`, description: "" },
	};

	const [item] = await testDb
		.insert(items)
		.values({
			categoryId,
			storeId,
			translations: translations || defaultTranslations,
			price,
			displayOrder,
			isAvailable,
			allergens,
		})
		.returning();

	return item;
}
