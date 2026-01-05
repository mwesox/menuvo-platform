/**
 * Customer browsing scenario for k6 load tests.
 *
 * Simulates customers browsing the store discovery page and viewing menus.
 * This tests the heaviest queries in the app:
 * - getPublicStores() - Store listing with filtering
 * - getStoreBySlug() - Full menu with nested categories, items, and options
 *
 * The menu query is particularly resource-intensive as it involves:
 * - Multiple nested JOINs (store → categories → items → options → choices)
 * - JSONB translation extraction for each entity
 * - Complex filtering and sorting
 */

import { check, sleep, group } from "k6";
import http from "k6/http";
import { getBaseUrl } from "../config/environments.js";
import { menuLoadTime, menuLoadErrors, menusLoaded } from "../lib/metrics.js";

// Test store slug - set in setup or use default
const TEST_STORE_SLUG = __ENV.TEST_STORE_SLUG || "load-test-restaurant";

/**
 * Main browsing scenario.
 * Simulates a customer discovering and browsing a restaurant menu.
 */
export default function customerBrowsing() {
	const baseUrl = getBaseUrl();

	group("store_discovery", function () {
		// Step 1: Load the store listing page
		const listingResponse = http.get(`${baseUrl}/`, {
			headers: {
				Accept: "text/html,application/xhtml+xml,application/xml",
			},
			tags: { name: "shop_listing", type: "page_load" },
		});

		check(listingResponse, {
			"listing page loads": (r) => r.status === 200,
			"listing has content": (r) => r.body && r.body.length > 1000,
		});

		// Simulate user looking at the listing (2-5 seconds)
		sleep(Math.random() * 3 + 2);
	});

	group("menu_browsing", function () {
		// Step 2: Load a specific restaurant menu
		const startTime = Date.now();

		const menuResponse = http.get(`${baseUrl}/${TEST_STORE_SLUG}`, {
			headers: {
				Accept: "text/html,application/xhtml+xml,application/xml",
			},
			tags: { name: "shop_menu", type: "page_load" },
		});

		const duration = Date.now() - startTime;
		menuLoadTime.add(duration);

		const menuSuccess = check(menuResponse, {
			"menu page loads": (r) => r.status === 200,
			"menu has content": (r) => r.body && r.body.length > 5000,
			"menu has theme": (r) => r.body && r.body.includes('data-theme="shop"'),
		});

		if (menuSuccess) {
			menusLoaded.add(1);
		} else {
			menuLoadErrors.add(true);
		}

		// Simulate user browsing the menu (30-120 seconds)
		// This is realistic for restaurant menu browsing
		sleep(Math.random() * 90 + 30);
	});
}

/**
 * Setup function - receives data from main setup.
 */
export function setup() {
	console.log(`Customer browsing scenario using store: ${TEST_STORE_SLUG}`);
	return { storeSlug: TEST_STORE_SLUG };
}

/**
 * Handle summary for this scenario.
 */
export function handleSummary(data) {
	return {
		stdout: JSON.stringify(
			{
				scenario: "customer-browsing",
				metrics: {
					menuLoadTime_p95: data.metrics.menu_load_time?.values?.["p(95)"],
					menuLoadErrors: data.metrics.menu_load_errors?.values?.rate,
					menusLoaded: data.metrics.menus_loaded?.values?.count,
				},
			},
			null,
			2,
		),
	};
}
