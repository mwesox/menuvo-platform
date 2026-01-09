/**
 * @menuvo/trpc - tRPC Package
 *
 * This package contains:
 * - tRPC router definitions
 * - Procedure middleware (auth, validation)
 * - Context types
 * - Shared schemas
 *
 * Usage:
 * - Import AppRouter type for client setup
 * - Import appRouter for server setup
 * - Import context utilities for request handling
 */

// Context exports
export {
	type Context,
	type CreateContextOptions,
	createContext,
	type MenuImportService,
	type Session,
	type StorageService,
} from "./context.js";
// Individual routers (for testing or selective imports)
export { authRouter } from "./routers/auth.router.js";
export { categoryRouter } from "./routers/category.router.js";
export { closuresRouter } from "./routers/closures.router.js";
export { hoursRouter } from "./routers/hours.router.js";
export { imageRouter } from "./routers/image.router.js";
export { importRouter } from "./routers/import.router.js";
// Router exports
export { type AppRouter, appRouter } from "./routers/index.js";
export { itemRouter } from "./routers/item.router.js";
export { merchantRouter } from "./routers/merchant.router.js";
export { optionRouter } from "./routers/option.router.js";
export { orderRouter } from "./routers/order.router.js";
export { paymentRouter } from "./routers/payment.router.js";
export { publicRouter } from "./routers/public.router.js";
export { servicePointRouter } from "./routers/service-point.router.js";
export { storeRouter } from "./routers/store.router.js";
export { subscriptionRouter } from "./routers/subscription.router.js";
export { translationRouter } from "./routers/translation.router.js";

// tRPC primitives (for extending or custom procedures)
export {
	mergeRouters,
	middleware,
	protectedProcedure,
	publicProcedure,
	router,
	storeOwnerProcedure,
} from "./trpc.js";

// ============================================================================
// SHARED CONSTANTS
// These are imported from DB schema and re-exported here for convenience
// ============================================================================

export { daysOfWeek, imageType } from "@menuvo/db/schema";

// Re-export schema types from appropriate schema files
export type { DayOfWeek } from "./schemas/hours.schema.js";
// Translation structures (used for internationalization)
// These are defined in option.schema.ts and re-exported from schemas/index.ts
export type {
	ChoiceTranslations,
	EntityTranslations,
	ImageType,
	OrderTypeValue,
} from "./schemas/index.js";
