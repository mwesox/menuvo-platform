/**
 * tRPC Client Setup for Console App (v11 pattern)
 *
 * Usage:
 * - In route loaders: use `trpcClient` or `trpc.xxx.queryOptions()`
 * - In components: use `useTRPC()` hook with TanStack Query
 *
 * Example:
 *   const trpc = useTRPC();
 *   const { data } = useQuery(trpc.store.list.queryOptions());
 */

import type { AppRouter } from "@menuvo/trpc";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import {
	createTRPCContext,
	createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import superjson from "superjson";

// API URL - in dev, Vite proxies /trpc to the API server
const getBaseUrl = () => {
	if (typeof window !== "undefined") {
		return "";
	}
	return "http://localhost:4000";
};

/**
 * Query Client with sensible defaults
 */
function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60, // 1 minute
				retry: 1,
			},
		},
	});
}

// Browser singleton
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
			}),
		],
	});
}

/**
 * React context-based hooks (for component usage)
 * - TRPCProvider: wrap your app
 * - useTRPC: get typed query/mutation options
 * - useTRPCClient: get raw tRPC client
 */
export const { TRPCProvider, useTRPC, useTRPCClient } =
	createTRPCContext<AppRouter>();

/**
 * Singleton tRPC client for use in loaders (SPA pattern)
 */
export const trpcClient = createTRPCReactClient();
export const queryClient = getQueryClient();

/**
 * Options proxy for direct usage in loaders
 * Use: trpc.store.list.queryOptions()
 */
export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
