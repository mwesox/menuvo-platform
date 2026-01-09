/**
 * App Router
 *
 * This file merges all domain routers into a single appRouter.
 * The AppRouter type is exported for use in clients.
 */

import { router } from "../trpc.js";
import { authRouter } from "./auth.router.js";
import { categoryRouter } from "./category.router.js";
import { closuresRouter } from "./closures.router.js";
import { hoursRouter } from "./hours.router.js";
import { imageRouter } from "./image.router.js";
import { importRouter } from "./import.router.js";
import { itemRouter } from "./item.router.js";
import { merchantRouter } from "./merchant.router.js";
import { onboardingRouter } from "./onboarding.router.js";
import { optionRouter } from "./option.router.js";
import { orderRouter } from "./order.router.js";
import { paymentRouter } from "./payment.router.js";
import { publicRouter } from "./public.router.js";
import { servicePointRouter } from "./service-point.router.js";
import { storeRouter } from "./store.router.js";
import { subscriptionRouter } from "./subscription.router.js";
import { translationRouter } from "./translation.router.js";

/**
 * Main application router
 * All domain routers are merged here under their namespace
 */
export const appRouter = router({
	/** Authentication procedures */
	auth: authRouter,

	/** Onboarding procedures (merchant + store creation) */
	onboarding: onboardingRouter,

	/** Store management procedures */
	store: storeRouter,

	/** Merchant settings procedures */
	merchant: merchantRouter,

	/** Menu category procedures */
	category: categoryRouter,

	/** Menu item procedures */
	item: itemRouter,

	/** Menu option procedures */
	option: optionRouter,

	/** Order management procedures */
	order: orderRouter,

	/** Payment procedures */
	payment: paymentRouter,

	/** Image management procedures */
	image: imageRouter,

	/** Menu import procedures */
	import: importRouter,

	/** Service point procedures */
	servicePoint: servicePointRouter,

	/** Translation procedures */
	translation: translationRouter,

	/** Store hours procedures */
	hours: hoursRouter,

	/** Store closures procedures */
	closures: closuresRouter,

	/** Subscription management procedures */
	subscription: subscriptionRouter,

	/** Public-facing procedures (no auth required) */
	public: publicRouter,
});

/**
 * Type definition for the app router
 * Used by clients to infer procedure types
 */
export type AppRouter = typeof appRouter;
