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

/**
 * Parameters for searching stores
 */
export interface SearchStoresParams {
	query?: string;
	city?: string;
	lat?: number;
	lng?: number;
	radius?: number;
	limit: number;
	cursor?: string;
}

/**
 * Result of searching stores
 */
export interface SearchStoresResult {
	stores: Array<{
		id: string;
		slug: string;
		name: string;
		logoUrl: string | null;
		street: string | null;
		city: string | null;
		postalCode: string | null;
		country: string | null;
		currency: string;
	}>;
	nextCursor?: string;
}

/**
 * Parameters for getting featured stores
 */
export interface GetFeaturedStoresParams {
	city?: string;
	limit: number;
}

/**
 * Store with status information
 */
export interface StoreWithStatus {
	id: string;
	slug: string;
	name: string;
	logoUrl: string | null;
	street: string | null;
	city: string | null;
	postalCode: string | null;
	country: string | null;
	currency: string;
	status?: {
		isOpen: boolean;
		nextOpenTime: string | null;
	};
}
