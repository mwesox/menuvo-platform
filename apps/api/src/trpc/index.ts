/**
 * tRPC Module
 *
 * Exports tRPC primitives and middleware.
 */

export type { AppRouter } from "../domains/router.js";
export { mapDomainErrorToTRPC } from "./error-mapper.js";
export {
	mergeRouters,
	middleware,
	protectedProcedure,
	publicProcedure,
	router,
	storeOwnerProcedure,
} from "./trpc.js";
