/**
 * App Router
 *
 * This file merges all domains routers into a single appRouter.
 * The AppRouter type is exported for use in clients.
 */

import { router } from "../trpc/index.js";
import { authRouter } from "./auth/router.js";
import { imageRouter } from "./images/router.js";
import { menuRouter } from "./menu/router.js";
import { merchantRouter } from "./merchants/router.js";
import { onboardingRouter } from "./onboarding/router.js";
import { orderRouter } from "./orders/router.js";
import { paymentRouter } from "./payments/router.js";
import { storeRouter } from "./stores/router.js";

/**
 * Main application router
 */
export const appRouter = router({
	/** Authentication: session, login, logout */
	auth: authRouter,

	/** Onboarding: merchant signup */
	onboarding: onboardingRouter,

	/** Menu domains: categories, items, options, translations, import */
	menu: menuRouter,

	/** Payments domains: payment operations */
	payments: paymentRouter,

	/** Store domains: store CRUD, hours, closures, service points */
	store: storeRouter,

	/** Merchant settings procedures */
	merchant: merchantRouter,

	/** Order management procedures */
	order: orderRouter,

	/** Image management procedures */
	image: imageRouter,
});

/**
 * Type definition for the app router
 * Used by clients to infer procedure types
 */
export type AppRouter = typeof appRouter;
