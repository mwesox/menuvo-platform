import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		SERVER_URL: z.string().url().optional(),
		DATABASE_URL: z.string().url().optional(),
		// Stripe
		STRIPE_SECRET_KEY: z.string().min(1),
		STRIPE_WEBHOOK_SECRET: z.string().min(1),
		STRIPE_WEBHOOK_SECRET_THIN: z.string().min(1),
		STRIPE_PRICE_STARTER: z.string().optional(),
		STRIPE_PRICE_PRO: z.string().optional(),
		STRIPE_PRICE_MAX: z.string().optional(),
		// OpenRouter AI
		OPENROUTER_API_KEY: z.string().min(1),
		// S3-compatible Storage (public images bucket)
		S3_ENDPOINT: z.string().url().optional(),
		S3_ACCESS_KEY_ID: z.string().min(1).optional(),
		S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
		S3_BUCKET: z.string().min(1).optional(),
		S3_REGION: z.string().optional(),
		S3_PUBLIC_URL: z.string().url().optional(),
		// S3 internal files bucket (for imports, not public)
		S3_FILES_BUCKET: z.string().min(1).optional(),
		// Encryption (for OAuth tokens)
		ENCRYPTION_KEY: z.string().min(32).optional(),
		// Mollie
		MOLLIE_API_KEY: z.string().min(1).optional(),
		MOLLIE_CLIENT_ID: z.string().min(1).optional(),
		MOLLIE_CLIENT_SECRET: z.string().min(1).optional(),
		MOLLIE_REDIRECT_URI: z.string().url().optional(),
		MOLLIE_ORG_ACCESS_TOKEN: z.string().min(1).optional(),
		MOLLIE_PRICE_STARTER: z.string().optional(),
		MOLLIE_PRICE_PRO: z.string().optional(),
		MOLLIE_PRICE_MAX: z.string().optional(),
		MOLLIE_TEST_MODE: z
			.enum(["true", "false"])
			.default("true")
			.transform((v) => v === "true"),
		MOLLIE_SKIP_ONBOARDING_CHECK: z
			.enum(["true", "false"])
			.default("false")
			.transform((v) => v === "true"),
		// Microsoft Graph Email (Azure AD)
		EMAIL_TENANT_ID: z.string().min(1).optional(),
		EMAIL_CLIENT_ID: z.string().min(1).optional(),
		EMAIL_CLIENT_SECRET: z.string().min(1).optional(),
	},

	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: "VITE_",

	client: {
		VITE_APP_TITLE: z.string().min(1).optional(),
		VITE_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
	},

	/**
	 * What object holds the environment variables at runtime.
	 * Server vars use process.env, client vars use import.meta.env (VITE_ prefix).
	 */
	runtimeEnv: {
		// Server-side (from process.env)
		SERVER_URL: process.env.SERVER_URL,
		DATABASE_URL: process.env.DATABASE_URL,
		STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
		STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
		STRIPE_WEBHOOK_SECRET_THIN: process.env.STRIPE_WEBHOOK_SECRET_THIN,
		STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER,
		STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
		STRIPE_PRICE_MAX: process.env.STRIPE_PRICE_MAX,
		OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
		// S3-compatible Storage
		S3_ENDPOINT: process.env.S3_ENDPOINT,
		S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
		S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
		S3_BUCKET: process.env.S3_BUCKET,
		S3_REGION: process.env.S3_REGION,
		S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
		S3_FILES_BUCKET: process.env.S3_FILES_BUCKET,
		// Encryption
		ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
		// Mollie
		MOLLIE_API_KEY: process.env.MOLLIE_API_KEY,
		MOLLIE_CLIENT_ID: process.env.MOLLIE_CLIENT_ID,
		MOLLIE_CLIENT_SECRET: process.env.MOLLIE_CLIENT_SECRET,
		MOLLIE_REDIRECT_URI: process.env.MOLLIE_REDIRECT_URI,
		MOLLIE_ORG_ACCESS_TOKEN: process.env.MOLLIE_ORG_ACCESS_TOKEN,
		MOLLIE_PRICE_STARTER: process.env.MOLLIE_PRICE_STARTER,
		MOLLIE_PRICE_PRO: process.env.MOLLIE_PRICE_PRO,
		MOLLIE_PRICE_MAX: process.env.MOLLIE_PRICE_MAX,
		MOLLIE_TEST_MODE: process.env.MOLLIE_TEST_MODE,
		MOLLIE_SKIP_ONBOARDING_CHECK: process.env.MOLLIE_SKIP_ONBOARDING_CHECK,
		// Microsoft Graph Email
		EMAIL_TENANT_ID: process.env.EMAIL_TENANT_ID,
		EMAIL_CLIENT_ID: process.env.EMAIL_CLIENT_ID,
		EMAIL_CLIENT_SECRET: process.env.EMAIL_CLIENT_SECRET,
		// Client-side (from import.meta.env)
		VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
		VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
	},

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * In order to solve these issues, we recommend that all new projects
	 * explicitly specify this option as true.
	 */
	emptyStringAsUndefined: true,
});
