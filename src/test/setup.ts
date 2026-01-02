/**
 * Vitest setup file for server tests.
 * Sets environment variables BEFORE any imports run.
 *
 * IMPORTANT: Env vars must be set at module scope (not in beforeAll)
 * so they're available when @/env and @/db modules are first imported.
 */

import { vi } from "vitest";

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
 * Mock TanStack Start's createServerFn for testing.
 *
 * In production, createServerFn creates RPC wrappers.
 * In tests, we want to call handlers directly.
 */
vi.mock("@tanstack/react-start", () => ({
	createServerFn: ({ method: _method }: { method: string }) => {
		let validator: ((data: unknown) => unknown) | null = null;
		let handlerFn: ((ctx: { data: unknown }) => Promise<unknown>) | null = null;

		const builder = {
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
					return handlerFn?.({ data: validated });
				};
			},
		};

		return builder;
	},
}));
