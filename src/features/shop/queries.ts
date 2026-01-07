import { queryOptions } from "@tanstack/react-query";
import type { PublicStoresFilter } from "./schemas";
import {
	getItemOptions,
	getPublicStores,
	getShopMenu,
	getStoreBySlug,
} from "./server/shop.functions";

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
	 * Key for a single store by slug (full data - deprecated).
	 */
	store: (slug: string) => [...shopKeys.all, "store", slug] as const,

	/**
	 * Key for shop menu (light load without option groups).
	 */
	menu: (slug: string) => [...shopKeys.all, "menu", slug] as const,

	/**
	 * Key for item options (detail load on demand).
	 */
	itemOptions: (itemId: string) =>
		[...shopKeys.all, "itemOptions", itemId] as const,
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
	 * @deprecated Use `menu` for light load + `itemOptions` for detail load
	 */
	storeBySlug: (slug: string) =>
		queryOptions({
			queryKey: shopKeys.store(slug),
			queryFn: () => getStoreBySlug({ data: { slug } }),
			staleTime: 1000 * 60 * 5, // 5 minutes
			enabled: !!slug,
		}),

	/**
	 * Query options for fetching shop menu (light load).
	 * Returns store info, categories, and items WITHOUT option groups.
	 */
	menu: (slug: string) =>
		queryOptions({
			queryKey: shopKeys.menu(slug),
			queryFn: () => getShopMenu({ data: { slug } }),
			staleTime: 1000 * 60 * 5, // 5 minutes
			enabled: !!slug,
		}),

	/**
	 * Query options for fetching item options (detail load).
	 * Called when opening item drawer for items with option groups.
	 */
	itemOptions: (itemId: string, storeSlug: string) =>
		queryOptions({
			queryKey: shopKeys.itemOptions(itemId),
			queryFn: () => getItemOptions({ data: { itemId, storeSlug } }),
			staleTime: 1000 * 60 * 5, // 5 minutes
			enabled: !!itemId && !!storeSlug,
		}),
};
