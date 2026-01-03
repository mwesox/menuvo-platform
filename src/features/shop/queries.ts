import { queryOptions } from "@tanstack/react-query";
import type { PublicStoresFilter } from "./schemas";
import { getPublicStores, getStoreBySlug } from "./server/shop.functions";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const shopKeys = {
	/**
	 * Base key for all shop-related queries.
	 */
	all: ["shop"] as const,

	/**
	 * Key for store listing queries.
	 */
	stores: () => [...shopKeys.all, "stores"] as const,

	/**
	 * Key for filtered store listings.
	 */
	storesByFilters: (filters: PublicStoresFilter) =>
		[...shopKeys.stores(), filters ?? {}] as const,

	/**
	 * Key for a single store by slug.
	 */
	store: (slug: string) => [...shopKeys.all, "store", slug] as const,
};

// ============================================================================
// QUERY OPTIONS
// ============================================================================

export const shopQueries = {
	/**
	 * Query options for fetching public stores with optional filters.
	 */
	stores: (filters?: PublicStoresFilter) =>
		queryOptions({
			queryKey: shopKeys.storesByFilters(filters),
			queryFn: () => getPublicStores({ data: filters }),
			staleTime: 1000 * 60 * 5, // 5 minutes
		}),

	/**
	 * Query options for fetching a store by its slug.
	 * Includes full menu data with categories, items, and option groups.
	 */
	storeBySlug: (slug: string) =>
		queryOptions({
			queryKey: shopKeys.store(slug),
			queryFn: () => getStoreBySlug({ data: { slug } }),
			staleTime: 1000 * 60 * 5, // 5 minutes
			enabled: !!slug,
		}),
};
