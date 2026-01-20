import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		// Core URLs with dev defaults
		SERVER_URL: z.string().url().default("http://localhost:4000"),
		CONSOLE_URL: z.string().url().default("http://localhost:3000"),
		DATABASE_URL: z.string().url().optional(),
		// Environment
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
		// CORS allowed origins (comma-separated list of URLs)
		ALLOWED_ORIGINS: z
			.string()
			.default(
				"http://localhost:3000,http://localhost:3001,http://localhost:5173",
			),
		// OpenRouter AI
		OPENROUTER_API_KEY: z.string().min(1),
		// S3-compatible Storage (public images bucket)
		S3_ENDPOINT: z.string().url().optional(),
		S3_ACCESS_KEY_ID: z.string().min(1).optional(),
		S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
		S3_BUCKET: z.string().min(1).optional(),
		S3_REGION: z.string().optional(),
		S3_BASE_URL: z.string().url().optional(),
		// S3 internal files bucket (for imports, not public)
		S3_FILES_BUCKET: z.string().min(1).optional(),
		// Encryption (for OAuth tokens) - 64 hex chars = 32 bytes = 256 bits
		ENCRYPTION_KEY: z.string().length(64),
		// Mollie
		MOLLIE_API_KEY: z.string().min(1).optional(),
		MOLLIE_CLIENT_ID: z.string().min(1).optional(),
		MOLLIE_CLIENT_SECRET: z.string().min(1).optional(),
		MOLLIE_REDIRECT_URI: z.string().url().optional(),
		MOLLIE_ORG_ACCESS_TOKEN: z.string().min(1).optional(),
		MOLLIE_TEST_MODE: z
			.enum(["true", "false"])
			.default("true")
			.transform((v) => v === "true"),
		MOLLIE_SKIP_ONBOARDING_CHECK: z
			.enum(["true", "false"])
			.default("false")
			.transform((v) => v === "true"),
		// SMTP Email
		SMTP_HOST: z.string().min(1).optional(),
		SMTP_PORT: z.coerce.number().default(587),
		SMTP_USER: z.string().min(1).optional(),
		SMTP_PASSWORD: z.string().min(1).optional(),
		// Menu Import AI Model
		MENU_IMPORT_MODEL_ID: z
			.string()
			.default("nvidia/nemotron-3-nano-30b-a3b:free"),
		MENU_IMPORT_MODEL_STRUCTURED: z
			.enum(["true", "false"])
			.default("false")
			.transform((v) => v === "true"),
		// AI Recommendations Model
		AI_RECOMMENDATIONS_MODEL_ID: z
			.string()
			.default("openai/gpt-oss-safeguard-20b"),
	},

	/**
	 * What object holds the environment variables at runtime.
	 */
	runtimeEnv: {
		SERVER_URL: process.env.SERVER_URL,
		CONSOLE_URL: process.env.CONSOLE_URL,
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		LOG_LEVEL: process.env.LOG_LEVEL,
		ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
		OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
		// S3-compatible Storage
		S3_ENDPOINT: process.env.S3_ENDPOINT,
		S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
		S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
		S3_BUCKET: process.env.S3_BUCKET,
		S3_REGION: process.env.S3_REGION,
		S3_BASE_URL: process.env.S3_BASE_URL,
		S3_FILES_BUCKET: process.env.S3_FILES_BUCKET,
		// Encryption
		ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
		// Mollie
		MOLLIE_API_KEY: process.env.MOLLIE_API_KEY,
		MOLLIE_CLIENT_ID: process.env.MOLLIE_CLIENT_ID,
		MOLLIE_CLIENT_SECRET: process.env.MOLLIE_CLIENT_SECRET,
		MOLLIE_REDIRECT_URI: process.env.MOLLIE_REDIRECT_URI,
		MOLLIE_ORG_ACCESS_TOKEN: process.env.MOLLIE_ORG_ACCESS_TOKEN,
		MOLLIE_TEST_MODE: process.env.MOLLIE_TEST_MODE,
		MOLLIE_SKIP_ONBOARDING_CHECK: process.env.MOLLIE_SKIP_ONBOARDING_CHECK,
		// SMTP Email
		SMTP_HOST: process.env.SMTP_HOST,
		SMTP_PORT: process.env.SMTP_PORT,
		SMTP_USER: process.env.SMTP_USER,
		SMTP_PASSWORD: process.env.SMTP_PASSWORD,
		// Menu Import AI Model
		MENU_IMPORT_MODEL_ID: process.env.MENU_IMPORT_MODEL_ID,
		MENU_IMPORT_MODEL_STRUCTURED: process.env.MENU_IMPORT_MODEL_STRUCTURED,
		// AI Recommendations Model
		AI_RECOMMENDATIONS_MODEL_ID: process.env.AI_RECOMMENDATIONS_MODEL_ID,
	},

	emptyStringAsUndefined: true,
});
