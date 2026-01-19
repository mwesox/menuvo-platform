/**
 * Menu (categories & items) queries and mutations using tRPC
 *
 * Custom hooks have been removed - use direct tRPC patterns in components.
 * This file only contains query option factories for complex queries.
 */

import type { AppRouter } from "@menuvo/api/trpc";
import { queryOptions } from "@tanstack/react-query";
import type { TRPCClient } from "@trpc/client";
import type { TrpcProxy } from "@/lib/trpc";

/**
 * Category query options factory that fetches categories with items.
 *
 * Uses the optimized backend endpoint that performs a single JOIN query
 * instead of parallel category + items fetches.
 */
export function getCategoriesQueryOptions(
	trpc: TrpcProxy,
	trpcClient: TRPCClient<AppRouter>,
	storeId: string,
) {
	return queryOptions({
		queryKey: trpc.menu.queries.getCategories.queryKey({ storeId }),
		queryFn: async () => {
			// Single API call - categories already include items via Drizzle JOIN
			return trpcClient.menu.queries.getCategories.query({ storeId });
		},
		enabled: !!storeId,
	});
}
