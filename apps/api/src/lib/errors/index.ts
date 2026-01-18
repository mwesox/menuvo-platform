/**
 * Error handling module.
 *
 * Provides typed error classes and client utilities for consistent
 * error handling across server and client.
 *
 * @example Server function
 * ```typescript
 * export const getOrder = createServerFn({ method: "GET" })
 *   .inputValidator(getOrderSchema)
 *   .handler(async ({ data }) => {
 *     const order = await db.query.orders.findFirst({
 *       where: eq(orders.id, data.orderId),
 *     });
 *     if (!order) {
 *       throw new NotFoundError("Order", data.orderId);
 *     }
 *     return order;
 *   });
 * ```
 *
 * @example Client mutation
 * ```typescript
 * useMutation({
 *   mutationFn: (input) => updateOrder({ data: input }),
 *   onError: createErrorHandler(
 *     {
 *       NotFoundError: () => toast.error("Order not found"),
 *     },
 *     () => toast.error("Something went wrong")
 *   ),
 * });
 * ```
 */

// Base error classes
export {
	AppError,
	BusinessRuleError,
	ConflictError,
	DatabaseError,
	ExternalServiceError,
	ForbiddenError,
	NotFoundError,
	type SerializedError,
	UnauthorizedError,
	ValidationError,
} from "./base";

// Client utilities
export {
	createErrorHandler,
	type ErrorHandlers,
	extractError,
	getErrorKey,
	isSerializedError,
	matchError,
} from "./client";
