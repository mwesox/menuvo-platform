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
 * Category query options factory that combines categories and items.
 */
export function getCategoriesWithItemsQueryOptions(
	trpc: TrpcProxy,
	trpcClient: TRPCClient<AppRouter>,
	storeId: string,
) {
	return queryOptions({
		queryKey: [...trpc.menu.categories.list.queryKey({ storeId }), "withItems"],
		queryFn: async () => {
			const [categories, items] = await Promise.all([
				trpcClient.menu.categories.list.query({ storeId }),
				trpcClient.menu.items.listByStore.query({ storeId }),
			]);

			// Combine categories with their items
			return categories.map((category) => ({
				...category,
				items: items
					.filter((item) => item.categoryId === category.id)
					.map((item) => ({
						id: item.id,
						isAvailable: item.isAvailable,
						imageUrl: item.imageUrl,
					})),
			}));
		},
		enabled: !!storeId,
	});
}
