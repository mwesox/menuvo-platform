/**
 * Store Service Interface
 *
 * Defines the contract for store operations.
 */

import type { Transaction } from "@menuvo/db";
import type {
	StoreClosuresConfig,
	StoreHoursConfig,
	stores,
} from "@menuvo/db/schema";
import type {
	CreateStoreInput,
	GetFeaturedStoresParams,
	SearchStoresParams,
	SearchStoresResult,
	SlugAvailabilityResult,
	StoreWithStatus,
	UpdateStoreInput,
} from "./types.js";

/**
 * Store service interface
 */
export interface IStoreService {
	/** List all stores for a merchant */
	list: (merchantId: string) => Promise<(typeof stores.$inferSelect)[]>;

	/** Get store by ID with ownership check */
	getById: (
		storeId: string,
		merchantId: string,
	) => Promise<typeof stores.$inferSelect>;

	/** Get store with hours and closures from JSONB settings */
	getWithDetails: (
		storeId: string,
		merchantId: string,
	) => Promise<
		typeof stores.$inferSelect & {
			hours: StoreHoursConfig;
			closures: StoreClosuresConfig;
		}
	>;

	/** Get store by slug (public - for shop storefront) */
	getBySlug: (slug: string) => Promise<typeof stores.$inferSelect>;

	/** Get unique cities where merchant has stores */
	getCities: (merchantId: string) => Promise<string[]>;

	/** Create a new store
	 * @param merchantId - The merchant ID
	 * @param input - Store data (slug is optional - generated from name if not provided)
	 * @param tx - Optional transaction for atomic operations
	 */
	create: (
		merchantId: string,
		input: CreateStoreInput,
		tx?: Transaction,
	) => Promise<typeof stores.$inferSelect>;

	/** Update store details */
	update: (
		storeId: string,
		merchantId: string,
		input: UpdateStoreInput,
	) => Promise<typeof stores.$inferSelect>;

	/** Delete a store */
	delete: (storeId: string, merchantId: string) => Promise<void>;

	/** Toggle store active status */
	toggleActive: (
		storeId: string,
		merchantId: string,
		isActive: boolean,
	) => Promise<typeof stores.$inferSelect>;

	/** Update store logo image */
	updateImage: (
		storeId: string,
		merchantId: string,
		imageUrl: string | null,
	) => Promise<typeof stores.$inferSelect>;

	/** Check if a slug is available */
	checkSlugAvailability: (
		name: string,
		excludeStoreId?: string,
	) => Promise<{ slug: string } & SlugAvailabilityResult>;

	/** Search stores by name, city, or location (public) */
	searchStores: (params: SearchStoresParams) => Promise<SearchStoresResult>;

	/** Get featured stores for homepage/discovery (public) */
	getFeaturedStores: (
		params: GetFeaturedStoresParams,
	) => Promise<StoreWithStatus[]>;
}
