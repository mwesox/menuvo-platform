/**
 * tRPC Initialization
 *
 * This is the core tRPC setup file that exports:
 * - tRPC factories (router, middleware, mergeRouters)
 * - Reusable procedures (public and protected)
 */

import { isAuthenticated, isStoreOwner } from "./middleware/index.js";
import {
	publicProcedure as basePublicProcedure,
	mergeRouters,
	middleware,
	router,
} from "./t.js";

/**
 * Re-export core tRPC factories
 */
export { middleware, mergeRouters, router };

/**
 * Public procedure - no authentication required
 * Use for public endpoints like menu viewing, store lookup
 */
export const publicProcedure = basePublicProcedure;

/**
 * Protected procedure - requires authentication
 * Use for endpoints that require a logged-in user
 */
export const protectedProcedure = publicProcedure.use(isAuthenticated);

/**
 * Store owner procedure - requires store ownership
 * Use for endpoints that modify store data
 */
export const storeOwnerProcedure = publicProcedure.use(isStoreOwner);
