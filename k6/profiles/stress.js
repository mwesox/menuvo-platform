/**
 * Stress test profile for k6 load tests.
 *
 * Find the breaking point:
 * - Ramp from 0 to 500 VUs
 * - Aggressive ramping to identify failure thresholds
 * - Relaxed thresholds (some failures expected)
 *
 * Total duration: ~16 minutes
 *
 * Run: bun run k6:stress
 */

import { stressThresholds } from "../config/thresholds.js";

export { default, setup, teardown, handleSummary } from "../scenarios/mixed-load.js";

export const options = {
	scenarios: {
		stress: {
			executor: "ramping-vus",
			startVUs: 0,
			stages: [
				{ duration: "2m", target: 50 }, // Warm up
				{ duration: "3m", target: 150 }, // Normal load
				{ duration: "3m", target: 300 }, // High load
				{ duration: "3m", target: 500 }, // Breaking point
				{ duration: "3m", target: 500 }, // Hold at peak
				{ duration: "2m", target: 0 }, // Ramp down
			],
			gracefulRampDown: "30s",
		},
	},
	thresholds: stressThresholds,

	// Summary configuration
	summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};
