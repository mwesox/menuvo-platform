import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Base logger configuration
 * - Development: Pretty printing with colors
 * - Production: JSON logs for structured logging
 */
export const logger = pino({
	level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
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
		env: process.env.NODE_ENV || "development",
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
