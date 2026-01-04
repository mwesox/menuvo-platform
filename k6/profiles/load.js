/**
 * Load test profile for k6 load tests.
 *
 * Normal expected load simulation:
 * - Ramp from 0 to 200 VUs over 5 minutes
 * - Hold at 200 VUs for 5 minutes
 * - Ramp down over 2 minutes
 *
 * Total duration: ~12 minutes
 *
 * Run: bun run k6:load
 */

import { baseThresholds } from "../config/thresholds.js";

export { default, setup, teardown, handleSummary } from "../scenarios/mixed-load.js";

export const options = {
	scenarios: {
		load: {
			executor: "ramping-vus",
			startVUs: 0,
			stages: [
				{ duration: "2m", target: 50 }, // Warm up
				{ duration: "3m", target: 200 }, // Ramp to full load
				{ duration: "5m", target: 200 }, // Hold at peak
				{ duration: "2m", target: 0 }, // Ramp down
			],
			gracefulRampDown: "30s",
		},
	},
	thresholds: baseThresholds,

	// Summary configuration
	summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};
