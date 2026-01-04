/**
 * Customer ordering scenario for k6 load tests.
 *
 * Simulates the full customer ordering flow:
 * 1. Browse to a store menu
 * 2. View items (page load)
 * 3. Add items to cart (client-side, not measured)
 * 4. Proceed to checkout
 * 5. Create order
 * 6. Create checkout session (if Stripe payment)
 *
 * NOTE: TanStack Start server functions require special handling.
 * This scenario tests page loads and documents POST mutation patterns.
 */

import { check, sleep, group } from "k6";
import http from "k6/http";
import { getBaseUrl } from "../config/environments.js";
import { generateSimpleOrder } from "../lib/data-generators.js";
import {
	menuLoadTime,
	orderCreateTime,
	checkoutSessionTime,
	ordersCreated,
	checkoutSessionsCreated,
	orderCreateErrors,
	checkoutErrors,
} from "../lib/metrics.js";

const TEST_STORE_SLUG = __ENV.TEST_STORE_SLUG || "load-test-restaurant";
const TEST_STORE_ID = parseInt(__ENV.TEST_STORE_ID || "1", 10);

/**
 * Main ordering scenario.
 */
export default function customerOrdering() {
	const baseUrl = getBaseUrl();

	group("browse_menu", function () {
		// Load the menu page
		const startTime = Date.now();

		const menuResponse = http.get(`${baseUrl}/shop/${TEST_STORE_SLUG}`, {
			headers: {
				Accept: "text/html,application/xhtml+xml,application/xml",
			},
			tags: { name: "shop_menu", type: "page_load" },
		});

		menuLoadTime.add(Date.now() - startTime);

		check(menuResponse, {
			"menu loaded for ordering": (r) => r.status === 200,
		});

		// User browses menu and selects items (10-30 seconds)
		sleep(Math.random() * 20 + 10);
	});

	group("checkout_page", function () {
		// Load the checkout page
		const checkoutResponse = http.get(`${baseUrl}/shop/${TEST_STORE_SLUG}/checkout`, {
			headers: {
				Accept: "text/html,application/xhtml+xml,application/xml",
			},
			tags: { name: "shop_checkout", type: "page_load" },
		});

		check(checkoutResponse, {
			"checkout page loads": (r) => r.status === 200,
		});

		// User fills in checkout form (5-15 seconds)
		sleep(Math.random() * 10 + 5);
	});

	// NOTE: To test order creation, you have two options:
	//
	// Option 1: Add a test API endpoint (recommended for load testing)
	// Create: src/routes/api/test/orders.ts
	// This exposes createOrder as a direct REST endpoint for testing
	//
	// Option 2: Use the internal TanStack Start RPC format
	// Server functions are called via POST to /_server with specific headers
	// See docs: https://tanstack.com/start/docs/framework/server-functions
	//
	// For now, we simulate the order creation with a comment:

	group("create_order", function () {
		// Generate order payload matching createOrderSchema
		const orderPayload = generateSimpleOrder(TEST_STORE_ID);

		console.log(`[${__VU}] Would create order with ${orderPayload.items.length} items`);
		console.log(`[${__VU}] Total: ${orderPayload.totalAmount} cents`);

		// TODO: Uncomment when test API endpoint is available
		// const startTime = Date.now();
		// const orderResponse = http.post(
		//   `${baseUrl}/api/test/orders`,
		//   JSON.stringify(orderPayload),
		//   {
		//     headers: { 'Content-Type': 'application/json' },
		//     tags: { name: 'create_order', type: 'mutation' },
		//   }
		// );
		// orderCreateTime.add(Date.now() - startTime);
		//
		// const orderSuccess = check(orderResponse, {
		//   'order created': (r) => r.status === 200,
		//   'order has id': (r) => JSON.parse(r.body).id > 0,
		// });
		//
		// if (orderSuccess) {
		//   ordersCreated.add(1);
		// } else {
		//   orderCreateErrors.add(true);
		// }

		// Simulate order creation time
		sleep(0.5);
		ordersCreated.add(1);
	});

	// Simulate time before next order (varies by user)
	sleep(Math.random() * 30 + 15);
}

export function setup() {
	console.log(`Customer ordering scenario using store: ${TEST_STORE_SLUG} (ID: ${TEST_STORE_ID})`);
	console.log("NOTE: Order creation is simulated. Add test API endpoint for real mutations.");
	return { storeSlug: TEST_STORE_SLUG, storeId: TEST_STORE_ID };
}
