/**
 * Custom k6 metrics for tracking application-specific performance.
 *
 * These metrics complement the built-in http_* metrics with
 * domain-specific measurements.
 */

import { Counter, Rate, Trend } from "k6/metrics";

// ============================================================================
// RESPONSE TIME TRENDS
// ============================================================================

/** Time to load menu (getStoreBySlug) */
export const menuLoadTime = new Trend("menu_load_time", true);

/** Time to create an order */
export const orderCreateTime = new Trend("order_create_time", true);

/** Time to create checkout session */
export const checkoutSessionTime = new Trend("checkout_session_time", true);

/** Time for kitchen poll (getKitchenOrders) */
export const kitchenPollTime = new Trend("kitchen_poll_time", true);

/** Time to update order status */
export const statusUpdateTime = new Trend("status_update_time", true);

/** Time for setup operations (create merchant, store, menu) */
export const setupTime = new Trend("setup_time", true);

// ============================================================================
// ERROR RATES
// ============================================================================

/** Menu loading error rate */
export const menuLoadErrors = new Rate("menu_load_errors");

/** Order creation error rate */
export const orderCreateErrors = new Rate("order_create_errors");

/** Checkout error rate */
export const checkoutErrors = new Rate("checkout_errors");

/** Kitchen operations error rate */
export const kitchenErrors = new Rate("kitchen_errors");

/** Setup error rate */
export const setupErrors = new Rate("setup_errors");

// ============================================================================
// THROUGHPUT COUNTERS
// ============================================================================

/** Total orders created */
export const ordersCreated = new Counter("orders_created");

/** Total checkout sessions created */
export const checkoutSessionsCreated = new Counter("checkout_sessions_created");

/** Total status updates processed */
export const statusUpdatesProcessed = new Counter("status_updates_processed");

/** Total menus loaded */
export const menusLoaded = new Counter("menus_loaded");

/** Total kitchen polls */
export const kitchenPolls = new Counter("kitchen_polls");

// ============================================================================
// SETUP COUNTERS
// ============================================================================

/** Merchants created during setup */
export const merchantsCreated = new Counter("merchants_created");

/** Stores created during setup */
export const storesCreated = new Counter("stores_created");

/** Menu items created during setup */
export const itemsCreated = new Counter("items_created");
