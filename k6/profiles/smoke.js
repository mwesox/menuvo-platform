/**
 * Smoke test profile for k6 load tests.
 *
 * Quick sanity check with minimal load:
 * - 5-10 VUs for 2 minutes
 * - Strict thresholds
 * - Fast feedback loop
 *
 * Run: bun run k6:smoke
 */

import { smokeThresholds } from "../config/thresholds.js";

// Re-export the mixed scenario function
export { default, setup, teardown, handleSummary } from "../scenarios/mixed-load.js";

export const options = {
	scenarios: {
		smoke: {
			executor: "ramping-vus",
			startVUs: 1,
			stages: [
				{ duration: "30s", target: 5 }, // Ramp up to 5 VUs
				{ duration: "1m", target: 10 }, // Hold at 10 VUs
				{ duration: "30s", target: 0 }, // Ramp down
			],
			gracefulRampDown: "10s",
		},
	},
	thresholds: smokeThresholds,

	// Summary configuration
	summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};
