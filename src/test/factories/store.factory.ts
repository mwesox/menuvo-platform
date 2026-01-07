/**
 * Factory for creating test stores.
 */

import { stores } from "@/db/schema";
import { testDb } from "../db";
import { uniqueId, uniqueSlug } from "../utils/test-id";

export interface StoreFactoryOptions {
	testRunId: string;
	merchantId: string;
	name?: string;
	isActive?: boolean;
	currency?: string;
}

export async function createTestStore(options: StoreFactoryOptions) {
	const {
		testRunId,
		merchantId,
		name: providedName,
		isActive = true,
		currency = "EUR",
	} = options;

	const name = providedName || `Test Store ${uniqueId(testRunId)}`;

	const [store] = await testDb
		.insert(stores)
		.values({
			merchantId,
			name,
			slug: uniqueSlug(testRunId, name),
			street: "123 Test Street",
			city: "Test City",
			postalCode: "12345",
			country: "DE",
			timezone: "Europe/Berlin",
			currency,
			isActive,
		})
		.returning();

	return store;
}
