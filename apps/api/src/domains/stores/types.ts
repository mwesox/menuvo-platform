/**
 * Stores Domain Types
 *
 * Domain types for store operations.
 */

/**
 * Input for creating a store
 */
export interface CreateStoreInput {
	name: string;
	street?: string;
	city?: string;
	postalCode?: string;
	country?: string;
	phone: string;
	email?: string;
	timezone?: string;
	currency?: string;
}

/**
 * Input for updating a store
 */
export interface UpdateStoreInput {
	name?: string;
	street?: string;
	city?: string;
	postalCode?: string;
	country?: string;
	phone?: string;
	email?: string;
	timezone?: string;
	currency?: string;
}

/**
 * Result of checking slug availability
 */
export interface SlugAvailabilityResult {
	available: boolean;
	suggestions: string[];
}
