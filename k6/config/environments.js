/**
 * Environment configurations for k6 load tests.
 *
 * Usage: k6 run --env TARGET_ENV=local k6/profiles/smoke.js
 */

export const environments = {
	local: {
		baseUrl: "http://[::1]:3000", // IPv6 localhost (Bun default)
		// Test data will be created dynamically during setup
		stripeMode: "mock",
		mockStripeUrl: "http://localhost:4242",
		dbPoolSize: 20,
		instanceCount: 1,
	},
	staging: {
		baseUrl: "https://staging.menuvo.app",
		stripeMode: "mock",
		mockStripeUrl: "https://stripe-mock.staging.menuvo.app",
		dbPoolSize: 20,
		instanceCount: 2,
	},
	production: {
		// WARNING: Use with extreme caution
		baseUrl: "https://www.menuvo.app",
		stripeMode: "skip", // Never hit real Stripe in load tests
		dbPoolSize: 20,
		instanceCount: 2,
	},
};

/**
 * Get the current environment configuration.
 * Defaults to 'local' if not specified.
 */
export function getEnv() {
	const envName = __ENV.TARGET_ENV || "local";
	const env = environments[envName];
	if (!env) {
		throw new Error(`Unknown environment: ${envName}`);
	}
	return env;
}

/**
 * Get base URL for the current environment.
 */
export function getBaseUrl() {
	return getEnv().baseUrl;
}
