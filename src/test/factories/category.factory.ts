/**
 * Factory for creating test categories.
 */

import { categories, type EntityTranslations } from "@/db/schema";
import { testDb } from "../db";
import { uniqueId } from "../utils/test-id";

export interface CategoryFactoryOptions {
	testRunId: string;
	storeId: number;
	/** Shortcut to set the German name directly */
	name?: string;
	translations?: EntityTranslations;
	displayOrder?: number;
	isActive?: boolean;
}

export async function createTestCategory(options: CategoryFactoryOptions) {
	const {
		testRunId,
		storeId,
		name,
		translations,
		displayOrder = 0,
		isActive = true,
	} = options;

	const defaultTranslations: EntityTranslations = name
		? { de: { name, description: "" }, en: { name, description: "" } }
		: {
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
