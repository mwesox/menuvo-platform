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
	// Legal entity fields (for German businesses)
	legalForm?: string;
	legalFormOther?: string;
	companyName?: string;
	representativeName?: string;
	registerCourt?: string;
	registerNumber?: string;
	vatId?: string | null;
	// Other fields
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
