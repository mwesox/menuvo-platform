/**
 * tRPC Client Setup for Console App (v11 pattern)
 *
 * Follows the official tRPC v11 pattern from:
 * https://trpc.io/docs/client/tanstack-react-query/usage
 *
 * Usage:
 * - In components: use `useTRPC()` hook
 * - In route loaders: use `trpc.xxx.queryOptions()` or `trpcClient`
 *
 * Example:
 *   const trpc = useTRPC();
 *   const { data } = useQuery(trpc.store.list.queryOptions());
 */

import type { AppRouter } from "@menuvo/api/trpc";
import { QueryClient } from "@tanstack/react-query";
import {
	createTRPCClient,
	httpBatchLink,
	httpLink,
	isNonJsonSerializable,
	splitLink,
} from "@trpc/client";
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
 * Required for console.menuvo.app to send cookies to api.menuvo.app.
 */
const fetchWithCredentials = (url: RequestInfo | URL, options?: RequestInit) =>
	fetch(url, { ...options, credentials: "include" });

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
 *
 * Uses splitLink to route non-JSON inputs (FormData, Blob, etc.)
 * to httpLink since they can't be batched/transformed.
 * See: https://trpc.io/docs/server/non-json-content-types
 */
export function createTRPCReactClient() {
	return createTRPCClient<AppRouter>({
		links: [
			splitLink({
				condition: (op) => isNonJsonSerializable(op.input),
				true: httpLink({
					url: `${getBaseUrl()}/trpc`,
					transformer: superjson,
					fetch: fetchWithCredentials,
				}),
				false: httpBatchLink({
					url: `${getBaseUrl()}/trpc`,
					transformer: superjson,
					fetch: fetchWithCredentials,
				}),
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
 * Use: trpc.store.list.queryOptions()
 */
export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});

/**
 * Query utils for route loaders (provides .fetch(), .ensureData(), etc.)
 * Use: trpcUtils.store.getWithDetails.ensureData({ storeId })
 */
export const trpcUtils = createTRPCQueryUtils({
	client: trpcClient,
	queryClient,
});

export type TrpcProxy = typeof trpc;
