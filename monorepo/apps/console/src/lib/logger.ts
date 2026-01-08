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

/**
 * Feature-specific loggers
 */
export const menuImportLogger = createLogger("menu-import");
export const imageLogger = createLogger("images");