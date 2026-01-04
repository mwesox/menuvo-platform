/**
 * Mixed load scenario for k6 load tests.
 *
 * Combines all scenarios with realistic traffic distribution:
 * - 70% Customer browsing (menu views)
 * - 25% Customer ordering (checkout flow)
 * - 5% Kitchen operations (order monitoring)
 *
 * This scenario provides the most realistic load test by simulating
 * concurrent usage patterns across all user types.
 */

import { check, sleep, group } from "k6";
import http from "k6/http";
import { getBaseUrl } from "../config/environments.js";
import { generateSimpleOrder } from "../lib/data-generators.js";
import {
	menuLoadTime,
	menuLoadErrors,
	menusLoaded,
	orderCreateTime,
	ordersCreated,
	kitchenPollTime,
	kitchenPolls,
} from "../lib/metrics.js";

const TEST_STORE_SLUG = __ENV.TEST_STORE_SLUG || "load-test-restaurant";
const TEST_STORE_ID = parseInt(__ENV.TEST_STORE_ID || "1", 10);

// ============================================================================
// SCENARIO FUNCTIONS
// ============================================================================

/**
 * Customer browsing scenario (70% of traffic).
 */
function browsingFlow() {
	const baseUrl = getBaseUrl();

	group("browsing", function () {
		// Load store listing
		const listingResponse = http.get(`${baseUrl}/shop`, {
			headers: { Accept: "text/html" },
			tags: { name: "shop_listing", scenario: "browsing" },
		});

		check(listingResponse, {
			"listing loads": (r) => r.status === 200,
		});

		sleep(Math.random() * 3 + 2);

		// Load specific menu
		const startTime = Date.now();
		const menuResponse = http.get(`${baseUrl}/shop/${TEST_STORE_SLUG}`, {
			headers: { Accept: "text/html" },
			tags: { name: "shop_menu", scenario: "browsing" },
		});

		menuLoadTime.add(Date.now() - startTime);

		const success = check(menuResponse, {
			"menu loads": (r) => r.status === 200,
		});

		if (success) {
			menusLoaded.add(1);
		} else {
			menuLoadErrors.add(true);
		}

		// Browse menu (realistic timing)
		sleep(Math.random() * 60 + 30);
	});
}

/**
 * Customer ordering scenario (25% of traffic).
 */
function orderingFlow() {
	const baseUrl = getBaseUrl();

	group("ordering", function () {
		// Load menu
		const startTime = Date.now();
		http.get(`${baseUrl}/shop/${TEST_STORE_SLUG}`, {
			headers: { Accept: "text/html" },
			tags: { name: "shop_menu", scenario: "ordering" },
		});
		menuLoadTime.add(Date.now() - startTime);

		// Browse time
		sleep(Math.random() * 15 + 10);

		// Load checkout
		http.get(`${baseUrl}/shop/${TEST_STORE_SLUG}/checkout`, {
			headers: { Accept: "text/html" },
			tags: { name: "shop_checkout", scenario: "ordering" },
		});

		// Fill form time
		sleep(Math.random() * 8 + 5);

		// Simulate order creation
		ordersCreated.add(1);
		sleep(0.5);

		// Time between orders
		sleep(Math.random() * 30 + 15);
	});
}

/**
 * Kitchen operations scenario (5% of traffic).
 */
function kitchenFlow() {
	const baseUrl = getBaseUrl();

	group("kitchen", function () {
		// 5 poll cycles (25 seconds)
		for (let i = 0; i < 5; i++) {
			const startTime = Date.now();

			http.get(`${baseUrl}/console/stores/${TEST_STORE_ID}/kitchen`, {
				headers: { Accept: "text/html" },
				tags: { name: "kitchen_poll", scenario: "kitchen" },
			});

			kitchenPollTime.add(Date.now() - startTime);
			kitchenPolls.add(1);

			sleep(5);
		}
	});
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Main execution function.
 * Randomly selects a scenario based on traffic distribution.
 */
export default function () {
	const rand = Math.random();

	if (rand < 0.7) {
		// 70% browsing
		browsingFlow();
	} else if (rand < 0.95) {
		// 25% ordering
		orderingFlow();
	} else {
		// 5% kitchen
		kitchenFlow();
	}
}

export function setup() {
	console.log("=".repeat(60));
	console.log("Mixed Load Test Starting");
	console.log("=".repeat(60));
	console.log(`Store: ${TEST_STORE_SLUG} (ID: ${TEST_STORE_ID})`);
	console.log("Traffic distribution: 70% browsing, 25% ordering, 5% kitchen");
	console.log("=".repeat(60));

	return {
		storeSlug: TEST_STORE_SLUG,
		storeId: TEST_STORE_ID,
	};
}

export function teardown(data) {
	console.log("=".repeat(60));
	console.log("Mixed Load Test Complete");
	console.log("=".repeat(60));
}

/**
 * Handle summary with scenario breakdown.
 */
export function handleSummary(data) {
	const summary = {
		scenario: "mixed-load",
		distribution: {
			browsing: "70%",
			ordering: "25%",
			kitchen: "5%",
		},
		metrics: {
			totalRequests: data.metrics.http_reqs?.values?.count,
			menuLoadTime_p95: data.metrics.menu_load_time?.values?.["p(95)"],
			menusLoaded: data.metrics.menus_loaded?.values?.count,
			ordersCreated: data.metrics.orders_created?.values?.count,
			kitchenPolls: data.metrics.kitchen_polls?.values?.count,
			errorRate: data.metrics.http_req_failed?.values?.rate,
		},
	};

	return {
		stdout: JSON.stringify(summary, null, 2),
		"k6/results/mixed-load.json": JSON.stringify(data),
	};
}
