/**
 * Quick sanity test - no realistic sleeps, just hammer the endpoints.
 */

import { check, sleep } from "k6";
import http from "k6/http";
import { getBaseUrl } from "../config/environments.js";
import { menuLoadTime, menuLoadErrors, menusLoaded } from "../lib/metrics.js";

const TEST_STORE_SLUG = __ENV.TEST_STORE_SLUG || "weso-pizza";

export const options = {
	vus: 5,
	duration: "30s",
	thresholds: {
		http_req_failed: ["rate<0.1"],
		http_req_duration: ["p(95)<3000"],
	},
};

export default function () {
	const baseUrl = getBaseUrl();

	// Load shop listing
	const listingStart = Date.now();
	const listing = http.get(`${baseUrl}/shop`, {
		tags: { name: "shop_listing" },
	});
	check(listing, { "listing ok": (r) => r.status === 200 });

	// Load menu
	const menuStart = Date.now();
	const menu = http.get(`${baseUrl}/shop/${TEST_STORE_SLUG}`, {
		tags: { name: "shop_menu" },
	});
	const menuDuration = Date.now() - menuStart;
	menuLoadTime.add(menuDuration);

	const menuOk = check(menu, {
		"menu ok": (r) => r.status === 200,
		"menu has content": (r) => r.body && r.body.length > 1000,
	});

	if (menuOk) {
		menusLoaded.add(1);
	} else {
		menuLoadErrors.add(true);
	}

	// Short pause between iterations (1-2 seconds)
	sleep(Math.random() + 1);
}

export function handleSummary(data) {
	console.log("\n=== Quick Test Results ===");
	console.log(`Requests: ${data.metrics.http_reqs?.values?.count || 0}`);
	console.log(`Failed: ${(data.metrics.http_req_failed?.values?.rate * 100 || 0).toFixed(2)}%`);
	console.log(`p95 Duration: ${data.metrics.http_req_duration?.values?.["p(95)"]?.toFixed(0) || "N/A"}ms`);
	console.log(`Menu Load p95: ${data.metrics.menu_load_time?.values?.["p(95)"]?.toFixed(0) || "N/A"}ms`);
	console.log("==========================\n");

	return {};
}
