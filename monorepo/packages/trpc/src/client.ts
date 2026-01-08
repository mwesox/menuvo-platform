/**
 * tRPC Client Factory
 *
 * This file provides utilities for creating tRPC clients in different environments:
 * - Browser (React apps)
 * - Server-side (SSR, API routes)
 */

import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "./routers/index.js";

/**
 * Configuration options for creating a tRPC client
 */
export interface CreateClientOptions {
	/** Base URL for the tRPC API (e.g., "http://localhost:3001/trpc") */
	url: string;
	/** Optional headers to include with every request */
	headers?: () => Record<string, string> | Promise<Record<string, string>>;
	/** Enable request/response logging (useful for development) */
	enableLogging?: boolean;
}

/**
 * Creates a vanilla tRPC client for use outside of React
 * Useful for:
 * - Route loaders
 * - Server-side data fetching
 * - Scripts and utilities
 */
export function createClient(options: CreateClientOptions) {
	const links = [];

	// Add logger link in development
	if (options.enableLogging) {
		links.push(
			loggerLink({
				enabled: () => true,
			}),
		);
	}

	// Add HTTP batch link for requests
	links.push(
		httpBatchLink({
			url: options.url,
			transformer: superjson,
			headers: options.headers,
		}),
	);

	return createTRPCClient<AppRouter>({
		links,
	});
}

/**
 * Type for the vanilla tRPC client
 */
export type TRPCClient = ReturnType<typeof createClient>;

/**
 * Re-export types needed for client setup
 */
export type { AppRouter };
