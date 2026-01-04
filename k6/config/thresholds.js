/**
 * Performance thresholds for k6 load tests.
 *
 * These thresholds define pass/fail criteria for different test scenarios.
 * Adjust based on your SLA requirements.
 */

/**
 * Base thresholds for normal load testing.
 */
export const baseThresholds = {
	// Overall HTTP metrics
	http_req_duration: ["p(95)<2000", "p(99)<5000"], // 95% under 2s, 99% under 5s
	http_req_failed: ["rate<0.01"], // Less than 1% failure rate

	// Menu loading (heavy query with JSONB translations)
	menu_load_time: ["p(95)<3000", "p(99)<5000"], // Menu is complex, allow more time
	menu_load_errors: ["rate<0.005"], // Less than 0.5% errors

	// Order creation (database transaction)
	order_create_time: ["p(95)<1500", "p(99)<3000"],
	order_create_errors: ["rate<0.01"],

	// Checkout session (external Stripe call, mocked)
	checkout_session_time: ["p(95)<2000", "p(99)<4000"],
	checkout_errors: ["rate<0.01"],

	// Kitchen operations (polled every 5s)
	kitchen_poll_time: ["p(95)<500", "p(99)<1000"], // Should be fast
	kitchen_errors: ["rate<0.005"],

	// Status updates
	status_update_time: ["p(95)<500", "p(99)<1000"],
};

/**
 * Stricter thresholds for smoke tests.
 * Used to quickly verify system health.
 */
export const smokeThresholds = {
	...baseThresholds,
	http_req_duration: ["p(95)<1000", "p(99)<2000"],
	http_req_failed: ["rate<0.001"],
};

/**
 * Relaxed thresholds for stress tests.
 * Used to find breaking points - some failures are expected.
 */
export const stressThresholds = {
	...baseThresholds,
	http_req_duration: ["p(95)<5000", "p(99)<10000"],
	http_req_failed: ["rate<0.05"], // Up to 5% failure acceptable at breaking point
	menu_load_time: ["p(95)<5000", "p(99)<8000"],
};

/**
 * Soak test thresholds - focus on stability over time.
 * Used to detect memory leaks and gradual degradation.
 */
export const soakThresholds = {
	...baseThresholds,
	// Memory leak detection via response time degradation
	http_req_duration: ["p(95)<2000", "avg<1000"],
};
