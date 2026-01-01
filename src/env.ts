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
		// OpenRouter AI
		OPENROUTER_API_KEY: z.string().min(1),
		// Redis (Bun reads REDIS_URL automatically)
		REDIS_URL: z.string().url().optional(),
		// S3-compatible Storage
		S3_ENDPOINT: z.string().url().optional(),
		S3_ACCESS_KEY_ID: z.string().min(1).optional(),
		S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
		S3_BUCKET: z.string().min(1).optional(),
		S3_REGION: z.string().optional(),
		S3_PUBLIC_URL: z.string().url().optional(),
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
		OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
		// Redis
		REDIS_URL: process.env.REDIS_URL,
		// S3-compatible Storage
		S3_ENDPOINT: process.env.S3_ENDPOINT,
		S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
		S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
		S3_BUCKET: process.env.S3_BUCKET,
		S3_REGION: process.env.S3_REGION,
		S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
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
