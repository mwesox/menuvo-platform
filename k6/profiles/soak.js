/**
 * Soak test profile for k6 load tests.
 *
 * Sustained load for detecting:
 * - Memory leaks
 * - Connection pool issues
 * - Gradual performance degradation
 * - Resource exhaustion
 *
 * Total duration: 30 minutes at constant load
 *
 * Run: bun run k6:soak
 */

import { soakThresholds } from "../config/thresholds.js";

export { default, setup, teardown, handleSummary } from "../scenarios/mixed-load.js";

export const options = {
	scenarios: {
		soak: {
			executor: "constant-vus",
			vus: 100,
			duration: "30m",
		},
	},
	thresholds: soakThresholds,

	// Summary configuration
	summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
};
