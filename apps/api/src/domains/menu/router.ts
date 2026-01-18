/**
 * Menu Domain Router
 *
 * Merges all menu-related sub-domains routers into a single namespace.
 * API paths: trpc.menu.categories.*, trpc.menu.items.*, etc.
 */

import { router } from "../../trpc/trpc.js";
import { categoryRouter } from "./categories/index.js";
import { importRouter } from "./import/router.js";
import { itemRouter } from "./items/index.js";
import { optionRouter } from "./options/index.js";
import { shopMenuRouter } from "./shop/index.js";
import { translationRouter } from "./translations/index.js";
import { vatRouter } from "./vat/index.js";

/**
 * Menu router merges all menu-related sub-routers
 */
export const menuRouter = router({
	/** Shop operations (public customer-facing) */
	shop: shopMenuRouter,

	/** Category operations (console/admin) */
	categories: categoryRouter,

	/** Item operations (console/admin) */
	items: itemRouter,

	/** Option group and choice operations (console/admin) */
	options: optionRouter,

	/** Translation operations (console/admin) */
	translations: translationRouter,

	/** Menu import operations (console/admin) */
	import: importRouter,

	/** VAT group management (protected - merchant-owned) */
	vat: vatRouter,
});

export type MenuRouter = typeof menuRouter;
