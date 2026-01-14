/**
 * Merchants Service Interface
 *
 * Defines the contract for merchant operations.
 */

import type { merchants } from "@menuvo/db/schema";
import type { UpdateLanguagesInput, UpdateMerchantInput } from "./types.js";

/**
 * Merchants service interface
 */
export interface IMerchantsService {
	getMerchant(merchantId: string): Promise<typeof merchants.$inferSelect>;
	updateMerchant(
		merchantId: string,
		input: UpdateMerchantInput,
	): Promise<typeof merchants.$inferSelect>;
	updateLanguages(
		merchantId: string,
		input: UpdateLanguagesInput,
	): Promise<typeof merchants.$inferSelect>;
}
