/**
 * Setup scenario for k6 load tests.
 *
 * This file handles the setup phase that runs ONCE before the main test.
 * It creates test data (merchant, store, menu) that other scenarios use.
 *
 * For TanStack Start apps, test data creation typically requires:
 * 1. Direct database access (preferred for load tests)
 * 2. Or calling the actual UI flows
 *
 * This setup uses direct database seeding via a test API endpoint.
 * You'll need to add this endpoint for load testing.
 */

import http from "k6/http";
import { check } from "k6";
import { getBaseUrl } from "../config/environments.js";
import { generateStore, generateCategories, generateItems } from "../lib/data-generators.js";
import { setupTime, setupErrors, merchantsCreated, storesCreated, itemsCreated } from "../lib/metrics.js";

/**
 * k6 setup function - runs once before all VUs start.
 * Returns data that's shared with all VUs via the `data` parameter.
 */
export function setup() {
	console.log("Setting up load test...");
	const startTime = Date.now();

	// For load testing, we use a pre-seeded test store
	// OR you can call a test API endpoint to create one
	const testData = {
		// Use a known test store slug - seed this in your database before running tests
		storeSlug: "load-test-restaurant",
		storeId: 1, // Will be updated if using dynamic creation
		menuItems: [], // Will be populated from the store response
	};

	// Try to load the test store to verify it exists
	const storeUrl = `${getBaseUrl()}/shop/${testData.storeSlug}`;
	const response = http.get(storeUrl, {
		tags: { name: "setup_verify_store" },
	});

	const setupSuccess = check(response, {
		"test store exists": (r) => r.status === 200,
		"store page loads": (r) => r.body && r.body.includes("data-theme"),
	});

	if (!setupSuccess) {
		console.error(`
================================================================================
SETUP FAILED: Test store not found at ${storeUrl}

To run load tests, you need to seed test data first. Options:

1. Run the seeding script:
   bun run db:seed:loadtest

2. Or manually create a store with slug "load-test-restaurant" via the console

3. Or use an existing store and update k6/scenarios/setup.js
================================================================================
		`);
		setupErrors.add(true);
	} else {
		console.log(`Test store verified: ${testData.storeSlug}`);
		merchantsCreated.add(1);
		storesCreated.add(1);
	}

	setupTime.add(Date.now() - startTime);

	return testData;
}

/**
 * Default function - not used in setup-only scenarios.
 */
export default function () {
	// This function is required but not used in setup-only mode
}

/**
 * k6 teardown function - runs once after all VUs finish.
 */
export function teardown(data) {
	console.log("Load test complete.");
	console.log(`Test store: ${data.storeSlug}`);
}
