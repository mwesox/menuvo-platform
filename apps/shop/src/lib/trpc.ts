/**
 * tRPC Client Setup for Shop App (v11 TanStack Query integration)
 *
 * Usage:
 * - In components: use `useTRPC()` hook with `queryOptions()` / `mutationOptions()`
 * - In route loaders: use `trpcClient` or `trpc.xxx.queryOptions()`
 *
 * Example:
 *   const trpc = useTRPC();
 *   const { data } = useQuery(trpc.menu.shop.getMenu.queryOptions({ storeSlug, languageCode }));
 */

import type { AppRouter } from "@menuvo/api/trpc";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCQueryUtils } from "@trpc/react-query";
import {
	createTRPCContext,
	createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import superjson from "superjson";
import { env } from "../env";

// API URL - defaults are set in env.ts
const getBaseUrl = () => env.VITE_API_URL;

/**
 * Custom fetch that includes credentials for cross-origin cookie support.
 * Required for shop.menuvo.app to send cookies to api.menuvo.app.
 */
const fetchWithCredentials = (url: RequestInfo | URL, options?: RequestInit) =>
	fetch(url, { ...options, credentials: "include" });

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60,
				retry: 1,
			},
		},
	});
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
	if (typeof window === "undefined") {
		return makeQueryClient();
	}
	if (!browserQueryClient) {
		browserQueryClient = makeQueryClient();
	}
	return browserQueryClient;
}

/**
 * Create tRPC client factory
 */
export function createTRPCReactClient() {
	return createTRPCClient<AppRouter>({
		links: [
			httpBatchLink({
				url: `${getBaseUrl()}/trpc`,
				transformer: superjson,
				fetch: fetchWithCredentials,
			}),
		],
	});
}

/**
 * React context-based hooks (for component usage)
 * Follows the official tRPC v11 pattern:
 * https://trpc.io/docs/client/tanstack-react-query/usage
 */
export const { TRPCProvider, useTRPC, useTRPCClient } =
	createTRPCContext<AppRouter>();

/**
 * Singleton tRPC client and options proxy for use in loaders
 * (Route loaders can't use React hooks, so we need these)
 */
export const trpcClient = createTRPCReactClient();
export const queryClient = getQueryClient();

/**
 * Options proxy for direct usage in loaders
 * Use: trpc.menu.shop.getMenu.queryOptions()
 */
export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});

/**
 * Query utils for route loaders (provides .fetch(), .ensureData(), etc.)
 * Use: trpcUtils.menu.shop.getMenu.ensureData({ ... })
 */
export const trpcUtils = createTRPCQueryUtils({
	client: trpcClient,
	queryClient,
});

export type TrpcClient = typeof trpcClient;
