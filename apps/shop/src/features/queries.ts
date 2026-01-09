import { queryOptions } from "@tanstack/react-query";
import { trpcClient } from "../lib/trpc";
import type { PublicStoresFilter } from "./schemas";

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
	storesByFilters: (filters?: PublicStoresFilter) =>
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
	 * Query options for fetching featured stores for discovery.
	 */
	featuredStores: (limit = 10) =>
		queryOptions({
			queryKey: [...shopKeys.stores(), "featured", limit] as const,
			queryFn: () => trpcClient.public.getFeaturedStores.query({ limit }),
			staleTime: 1000 * 60 * 5, // 5 minutes
		}),

	/**
	 * Query options for searching stores.
	 */
	searchStores: (query: string, limit = 20) =>
		queryOptions({
			queryKey: [...shopKeys.stores(), "search", query],
			queryFn: () => trpcClient.public.searchStores.query({ query, limit }),
			staleTime: 1000 * 60 * 5, // 5 minutes
			enabled: query.length > 0,
		}),

	/**
	 * Query options for fetching shop menu.
	 * Returns store info, categories, and items.
	 */
	menu: (storeSlug: string) =>
		queryOptions({
			queryKey: shopKeys.menu(storeSlug),
			queryFn: () => trpcClient.public.getMenu.query({ storeSlug }),
			staleTime: 1000 * 60 * 5, // 5 minutes
			enabled: !!storeSlug,
		}),

	/**
	 * Query options for fetching item details.
	 * Used when opening item drawer for items with option groups.
	 */
	itemDetails: (_storeSlug: string, itemId: string) =>
		queryOptions({
			queryKey: shopKeys.itemOptions(itemId),
			queryFn: () => trpcClient.public.getItemDetails.query({ itemId }),
			staleTime: 1000 * 60 * 5, // 5 minutes
			enabled: !!itemId,
		}),
};
