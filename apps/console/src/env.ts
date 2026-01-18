import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_API_URL: z.string().url().default("http://localhost:4000"),
		VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
		VITE_SENTRY_DSN: z.string().optional(),
	},
	runtimeEnv: {
		VITE_API_URL: import.meta.env.VITE_API_URL,
		VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
		VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
	},
	emptyStringAsUndefined: true,
});
