/**
 * Merchants Domain Types
 *
 * Domain types for merchant operations.
 */

/**
 * Input for creating a new merchant
 */
export interface CreateMerchantInput {
	name: string;
	ownerName: string;
	email: string;
	phone?: string;
	supportedLanguages?: string[];
	subscriptionStatus?: string;
	subscriptionTrialEndsAt?: Date;
}

/**
 * Input for updating merchant general settings
 */
export interface UpdateMerchantInput {
	name?: string;
	ownerName?: string;
	email?: string;
	phone?: string;
	description?: string;
}

/**
 * Input for updating merchant languages
 */
export interface UpdateLanguagesInput {
	supportedLanguages: string[];
}
