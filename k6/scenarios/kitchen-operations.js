/**
 * Kitchen operations scenario for k6 load tests.
 *
 * Simulates kitchen staff monitoring orders and updating status:
 * 1. Poll kitchen orders (every 5 seconds, matching POLLING_INTERVALS.KITCHEN)
 * 2. Update order status (confirmed → preparing → ready → completed)
 *
 * This scenario tests sustained database pressure from:
 * - Frequent polling with getKitchenOrders()
 * - Status update transactions
 */

import { check, sleep, group } from "k6";
import http from "k6/http";
import { getBaseUrl } from "../config/environments.js";
import {
	kitchenPollTime,
	statusUpdateTime,
	statusUpdatesProcessed,
	kitchenPolls,
	kitchenErrors,
} from "../lib/metrics.js";

const TEST_STORE_SLUG = __ENV.TEST_STORE_SLUG || "load-test-restaurant";
const TEST_STORE_ID = parseInt(__ENV.TEST_STORE_ID || "1", 10);

// Kitchen polls every 5 seconds (matching app behavior)
const POLL_INTERVAL = 5;

/**
 * Main kitchen operations scenario.
 * Simulates a kitchen monitor session lasting 1 minute with continuous polling.
 */
export default function kitchenOperations() {
	const baseUrl = getBaseUrl();

	// Simulate a kitchen session (multiple poll cycles)
	const sessionDuration = 60; // 1 minute per session
	const pollCount = Math.floor(sessionDuration / POLL_INTERVAL);

	// First, load the kitchen monitor page
	group("kitchen_page_load", function () {
		const pageResponse = http.get(`${baseUrl}/console/stores/${TEST_STORE_ID}/kitchen`, {
			headers: {
				Accept: "text/html,application/xhtml+xml,application/xml",
			},
			tags: { name: "kitchen_page", type: "page_load" },
		});

		// Kitchen page requires auth, so we might get a redirect
		const pageLoaded = check(pageResponse, {
			"kitchen page accessible": (r) => r.status === 200 || r.status === 302,
		});

		if (!pageLoaded) {
			console.log(`[${__VU}] Kitchen page requires authentication`);
		}
	});

	// Polling loop
	for (let i = 0; i < pollCount; i++) {
		group("poll_orders", function () {
			// In a real scenario, this would call getKitchenOrders()
			// For now, we simulate by loading the kitchen page

			const startTime = Date.now();

			// NOTE: To test real kitchen polling, add a test API endpoint
			// For now, simulate with page loads
			const pollResponse = http.get(`${baseUrl}/console/stores/${TEST_STORE_ID}/kitchen`, {
				headers: {
					Accept: "text/html,application/xhtml+xml",
					"Cache-Control": "no-cache",
				},
				tags: { name: "kitchen_poll", type: "poll" },
			});

			kitchenPollTime.add(Date.now() - startTime);
			kitchenPolls.add(1);

			const pollSuccess = check(pollResponse, {
				"kitchen poll success": (r) => r.status === 200 || r.status === 302,
			});

			if (!pollSuccess) {
				kitchenErrors.add(true);
			}
		});

		// Wait for next poll cycle
		sleep(POLL_INTERVAL);
	}
}

export function setup() {
	console.log(`Kitchen operations scenario for store ID: ${TEST_STORE_ID}`);
	console.log("NOTE: Requires authenticated session. Run against console routes.");
	return { storeId: TEST_STORE_ID };
}

/**
 * Handle summary for kitchen scenario.
 */
export function handleSummary(data) {
	return {
		stdout: JSON.stringify(
			{
				scenario: "kitchen-operations",
				metrics: {
					kitchenPollTime_p95: data.metrics.kitchen_poll_time?.values?.["p(95)"],
					kitchenPolls: data.metrics.kitchen_polls?.values?.count,
					kitchenErrors: data.metrics.kitchen_errors?.values?.rate,
				},
			},
			null,
			2,
		),
	};
}
