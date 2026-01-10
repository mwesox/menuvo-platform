/**
 * tRPC Client Setup for Shop App (v11 pattern)
 *
 * Usage:
 * - In route loaders: use `trpcClient` or `trpc.xxx.queryOptions()`
 * - In components: use `useTRPC()` hook with TanStack Query
 */

import type { AppRouter } from "@menuvo/trpc";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import {
	createTRPCContext,
	createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import superjson from "superjson";
import { env } from "../env";

// API URL - in production uses VITE_API_URL, in dev Vite proxies /trpc
const getBaseUrl = () => {
	if (typeof window !== "undefined") {
		return env.VITE_API_URL || "";
	}
	return env.VITE_API_URL || "http://localhost:4000";
};

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

export const { TRPCProvider, useTRPC, useTRPCClient } =
	createTRPCContext<AppRouter>();

export const trpcClient = createTRPCReactClient();
export const queryClient = getQueryClient();

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
