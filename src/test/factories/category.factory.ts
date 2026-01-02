/**
 * Factory for creating test categories.
 */

import { categories, type EntityTranslations } from "@/db/schema";
import { testDb } from "../db";
import { uniqueId } from "../utils/test-id";

export interface CategoryFactoryOptions {
	testRunId: string;
	storeId: number;
	translations?: EntityTranslations;
	displayOrder?: number;
	isActive?: boolean;
}

export async function createTestCategory(options: CategoryFactoryOptions) {
	const {
		testRunId,
		storeId,
		translations,
		displayOrder = 0,
		isActive = true,
	} = options;

	const defaultTranslations: EntityTranslations = {
		de: { name: `Test Kategorie ${uniqueId(testRunId)}`, description: "" },
		en: { name: `Test Category ${uniqueId(testRunId)}`, description: "" },
	};

	const [category] = await testDb
		.insert(categories)
		.values({
			storeId,
			translations: translations || defaultTranslations,
			displayOrder,
			isActive,
		})
		.returning();

	return category;
}
