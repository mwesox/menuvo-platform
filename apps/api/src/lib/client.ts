/**
 * Client-side utilities for error handling.
 *
 * Provides typed error extraction and handler creation for mutations.
 */

import type { SerializedError } from "./base";

// ============================================================================
// ERROR EXTRACTION
// ============================================================================

/**
 * Type guard for SerializedError
 */
export function isSerializedError(value: unknown): value is SerializedError {
	return (
		typeof value === "object" &&
		value !== null &&
		"_tag" in value &&
		typeof (value as SerializedError)._tag === "string" &&
		"message" in value &&
		typeof (value as SerializedError).message === "string" &&
		"code" in value &&
		typeof (value as SerializedError).code === "string"
	);
}

/**
 * Extract SerializedError from a caught error.
 *
 * Works with:
 * - AppError instances (have toJSON)
 * - Errors with JSON message (serialized across network)
 * - Plain SerializedError objects
 *
 * @example
 * ```typescript
 * try {
 *   await getOrder({ data: { orderId: 123 } });
 * } catch (error) {
 *   const appError = extractError(error);
 *   if (appError?._tag === "NotFoundError") {
 *     console.log("Order not found:", appError.context);
 *   }
 * }
 * ```
 */
export function extractError(error: unknown): SerializedError | undefined {
	// AppError or error with toJSON
	if (error instanceof Error) {
		// Check for _tag property (AppError instance)
		if ("_tag" in error && isSerializedError(error)) {
			return {
				_tag: error._tag,
				message: error.message,
				code: (error as SerializedError).code,
				context: (error as SerializedError).context,
			};
		}

		// Try to parse JSON from message (serialized across network)
		try {
			const parsed = JSON.parse(error.message);
			if (isSerializedError(parsed)) {
				return parsed;
			}
		} catch {
			// Not a JSON message
		}
	}

	// Plain SerializedError object
	if (isSerializedError(error)) {
		return error;
	}

	return undefined;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Type for error handler functions by tag.
 */
export type ErrorHandlers = {
	[tag: string]: ((error: SerializedError) => void) | undefined;
};

/**
 * Create a typed error handler for mutations.
 *
 * @example
 * ```typescript
 * useMutation({
 *   mutationFn: (input) => updateOrderStatus({ data: input }),
 *   onError: createErrorHandler(
 *     {
 *       InvalidOrderTransition: (e) =>
 *         toast.error(t("errors.invalidTransition", {
 *           from: e.context?.from,
 *           to: e.context?.to
 *         })),
 *       NotFoundError: () => toast.error(t("errors.orderNotFound")),
 *     },
 *     () => toast.error(t("errors.generic"))
 *   ),
 * });
 * ```
 */
export function createErrorHandler(
	handlers: ErrorHandlers,
	fallback: (error: SerializedError) => void,
): (error: unknown) => void {
	return (error: unknown) => {
		const appError = extractError(error);

		if (!appError) {
			console.error("[Error] Unrecognized error:", error);
			fallback({
				_tag: "UnexpectedError",
				message: error instanceof Error ? error.message : "Unknown error",
				code: "UNEXPECTED_ERROR",
			});
			return;
		}

		const handler = handlers[appError._tag];
		if (handler) {
			handler(appError);
		} else {
			fallback(appError);
		}
	};
}

/**
 * Get i18n key for error tag.
 */
export function getErrorKey(error: SerializedError): string {
	const tagToKey: Record<string, string> = {
		NotFoundError: "error.notFound",
		ValidationError: "error.validation",
		BusinessRuleError: "error.businessRule",
		ExternalServiceError: "error.externalService",
		DatabaseError: "error.database",
		UnauthorizedError: "error.unauthorized",
		ForbiddenError: "error.forbidden",
		UnexpectedError: "error.unexpected",
	};

	return tagToKey[error._tag] ?? "error.unexpected";
}

/**
 * Pattern match on error tags.
 */
export function matchError<R>(
	error: SerializedError,
	matchers: { [K: string]: ((error: SerializedError) => R) | undefined } & {
		_: (error: SerializedError) => R;
	},
): R {
	const matcher = matchers[error._tag];
	if (matcher) {
		return matcher(error);
	}
	return matchers._(error);
}
