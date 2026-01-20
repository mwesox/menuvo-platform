import pino from "pino";
import { env } from "../env";

const isDev = env.NODE_ENV !== "production";

/**
 * Base logger configuration
 * - Development: Pretty printing with colors, debug level
 * - Production: JSON logs for structured logging
 *
 * Defaults are set in env.ts (LOG_LEVEL=info, NODE_ENV=development)
 */
export const logger = pino({
	// In dev, use debug unless explicitly set; in prod use configured level
	level: isDev ? "debug" : env.LOG_LEVEL,
	...(isDev && {
		transport: {
			target: "pino/file",
			options: { destination: 1 },
		},
		formatters: {
			level: (label) => ({ level: label }),
		},
	}),
	base: {
		env: env.NODE_ENV,
	},
});

/**
 * Create a child logger for a specific module/feature
 */
export function createLogger(module: string) {
	return logger.child({ module });
}

// Pre-configured loggers for common modules
export const stripeLogger = createLogger("stripe");
export const mollieLogger = createLogger("mollie");
export const imageLogger = createLogger("image");
export const menuImportLogger = createLogger("menu-import");
export const ordersLogger = createLogger("orders");
export const paymentsLogger = createLogger("payments");
export const webhookLogger = createLogger("webhook");
export const mcpLogger = createLogger("mcp");
export const emailLogger = createLogger("email");
export const aiRecommendationsLogger = createLogger("ai-recommendations");
export const aiLogger = createLogger("ai");
