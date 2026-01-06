/**
 * Vitest setup file for server tests.
 * Sets environment variables BEFORE any imports run.
 *
 * IMPORTANT: Env vars must be set at module scope (not in beforeAll)
 * so they're available when @/env and @/db modules are first imported.
 */

import { vi } from "vitest";

/**
 * Test auth context that can be set by individual tests.
 * Set this in beforeAll/beforeEach to mock authenticated merchant.
 */
export const testAuth: {
	merchantId: number | null;
	merchant: { id: number; name: string; supportedLanguages: string[] } | null;
} = {
	merchantId: null,
	merchant: null,
};

/**
 * Helper to set test auth context.
 */
export function setTestAuth(auth: {
	merchantId: number;
	merchant: { id: number; name: string; supportedLanguages?: string[] };
}) {
	testAuth.merchantId = auth.merchantId;
	testAuth.merchant = {
		...auth.merchant,
		supportedLanguages: auth.merchant.supportedLanguages ?? ["de"],
	};
}

/**
 * Helper to clear test auth context.
 */
export function clearTestAuth() {
	testAuth.merchantId = null;
	testAuth.merchant = null;
}

// Override DATABASE_URL for tests - MUST be before any other imports
process.env.DATABASE_URL =
	process.env.DATABASE_URL_TEST ||
	"postgresql://postgres:postgres@localhost:5433/menuvo_test";

// Set test-safe defaults for required env vars
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_fake";
process.env.STRIPE_WEBHOOK_SECRET =
	process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_fake";
process.env.STRIPE_WEBHOOK_SECRET_THIN =
	process.env.STRIPE_WEBHOOK_SECRET_THIN || "whsec_test_fake";
process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "test_key";

// S3 defaults for tests
process.env.S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
process.env.S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "minioadmin";
process.env.S3_SECRET_ACCESS_KEY =
	process.env.S3_SECRET_ACCESS_KEY || "minioadmin";
process.env.S3_BUCKET = process.env.S3_BUCKET || "menuvo-images-test";
process.env.S3_REGION = process.env.S3_REGION || "us-east-1";
process.env.S3_PUBLIC_URL =
	process.env.S3_PUBLIC_URL || "http://localhost:9000/menuvo-images-test";
process.env.S3_FILES_BUCKET =
	process.env.S3_FILES_BUCKET || "menuvo-files-test";

/**
 * Mock Bun's S3Client for testing (not available in Node.js).
 * The files-client module uses Bun's native S3Client which isn't available in Vitest.
 */
vi.mock("@/lib/storage/files-client", () => ({
	filesStorage: {},
	uploadFile: vi.fn().mockResolvedValue(undefined),
	getFile: vi.fn().mockResolvedValue(Buffer.from("")),
	deleteFile: vi.fn().mockResolvedValue(undefined),
	fileExists: vi.fn().mockResolvedValue(false),
}));

/**
 * Mock TanStack Start's createServerFn for testing.
 *
 * In production, createServerFn creates RPC wrappers.
 * In tests, we want to call handlers directly.
 *
 * When middleware is used (e.g., withAuth), we inject testAuth directly
 * instead of calling the actual middleware (which would require cookies).
 */
vi.mock("@tanstack/react-start", () => ({
	createServerFn: (_options?: { method?: string }) => {
		let validator: ((data: unknown) => unknown) | null = null;
		let handlerFn:
			| ((ctx: { data: unknown; context?: unknown }) => Promise<unknown>)
			| null = null;
		let hasAuthMiddleware = false;

		const builder = {
			middleware: (
				_mws: Array<(ctx: { next: (opts?: unknown) => unknown }) => unknown>,
			) => {
				// Instead of storing middleware, just flag that auth is needed
				// The actual withAuth middleware can't work in tests (no cookies)
				hasAuthMiddleware = true;
				return builder;
			},
			inputValidator: (schema: { parse: (data: unknown) => unknown }) => {
				validator = (data: unknown) => schema.parse(data);
				return builder;
			},
			handler: (fn: (ctx: { data: unknown }) => Promise<unknown>) => {
				handlerFn = fn;

				// Return a callable function that simulates the server function
				return async (input?: { data?: unknown }) => {
					const data = input?.data;
					const validated = validator ? validator(data) : data;

					// Build context - inject auth from testAuth if middleware was used
					let context: Record<string, unknown> = {};
					if (hasAuthMiddleware) {
						// Import testAuth dynamically to get current value
						const { testAuth } = await import("./setup");
						if (!testAuth.merchantId || !testAuth.merchant) {
							throw new Error("Unauthorized: No merchant session");
						}
						context = {
							auth: {
								merchantId: testAuth.merchantId,
								merchant: testAuth.merchant,
							},
						};
					}

					return handlerFn?.({ data: validated, context });
				};
			},
		};

		return builder;
	},
	createMiddleware: () => ({
		server: (
			fn: (ctx: { next: (opts?: unknown) => unknown }) => Promise<unknown>,
		) => fn,
	}),
}));
