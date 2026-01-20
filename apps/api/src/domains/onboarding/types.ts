/**
 * Onboarding Domain Types
 *
 * Types for the onboarding workflow that orchestrates
 * merchant and store creation.
 */

import type { merchants, stores } from "@menuvo/db/schema";

/**
 * Input for the onboarding flow
 */
export interface OnboardInput {
	merchant: {
		name: string;
		ownerName: string;
		email: string;
		phone?: string;
	};
	store: {
		name: string;
		street: string;
		city: string;
		postalCode: string;
		country: string;
		/** ISO alpha-2 country code (e.g., "DE", "AT", "CH"). Derived from country if not provided. */
		countryCode?: string;
		timezone?: string;
		currency?: string;
	};
}

/**
 * Result of a successful onboarding
 */
export interface OnboardResult {
	merchant: typeof merchants.$inferSelect;
	store: typeof stores.$inferSelect;
}
