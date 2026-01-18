/**
 * Merchants Service Interface
 *
 * Defines the contract for merchant operations.
 */

import type { Transaction } from "@menuvo/db";
import type { merchants } from "@menuvo/db/schema";
import type {
	CreateMerchantInput,
	UpdateLanguagesInput,
	UpdateMerchantInput,
} from "./types.js";

/**
 * Merchants service interface
 */
export interface IMerchantsService {
	/**
	 * Check if an email is already registered
	 */
	isEmailRegistered(email: string): Promise<boolean>;

	/**
	 * Create a new merchant
	 * @param input - Merchant data
	 * @param tx - Optional transaction for atomic operations
	 * @throws ConflictError if email already exists (only checked when tx is not provided)
	 * @throws ValidationError if creation fails
	 */
	create(
		input: CreateMerchantInput,
		tx?: Transaction,
	): Promise<typeof merchants.$inferSelect>;

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
