/**
 * Factory for creating test merchants.
 */

import { merchants } from "@/db/schema";
import { testDb } from "../db";
import { uniqueEmail, uniqueId } from "../utils/test-id";

export interface MerchantFactoryOptions {
	testRunId: string;
	name?: string;
	email?: string;
	supportedLanguages?: string[];
}

export async function createTestMerchant(options: MerchantFactoryOptions) {
	const { testRunId, name, email, supportedLanguages = ["de", "en"] } = options;

	const [merchant] = await testDb
		.insert(merchants)
		.values({
			name: name || `Test Merchant ${uniqueId(testRunId)}`,
			email: email || uniqueEmail(testRunId),
			supportedLanguages,
		})
		.returning();

	return merchant;
}
