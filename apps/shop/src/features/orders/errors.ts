/**
 * Order-specific error types.
 *
 * These errors provide detailed context for order operations,
 * enabling specific error messages and handling on the client.
 */

import { AppError } from "../../lib/errors";

/**
 * Invalid order status transition error.
 * Thrown when attempting to transition to an invalid status.
 */
export class InvalidOrderTransitionError extends AppError {
	_tag = "InvalidOrderTransitionError";
	code = "INVALID_ORDER_TRANSITION";

	constructor(from: string, to: string) {
		super(`Cannot transition order from ${from} to ${to}`, { from, to });
	}
}

/**
 * Order not cancellable error.
 * Thrown when attempting to cancel an order that cannot be cancelled.
 */
export class OrderNotCancellableError extends AppError {
	_tag = "OrderNotCancellableError";
	code = "ORDER_NOT_CANCELLABLE";

	constructor(status: string) {
		super(`Cannot cancel order with status: ${status}`, { status });
	}
}

/**
 * Order not awaiting payment error.
 * Thrown when attempting payment operations on an order not in payment state.
 */
export class OrderNotAwaitingPaymentError extends AppError {
	_tag = "OrderNotAwaitingPaymentError";
	code = "ORDER_NOT_AWAITING_PAYMENT";

	constructor(currentStatus: string, paymentStatus: string) {
		super(
			`Order is not awaiting payment (status: ${currentStatus}, payment: ${paymentStatus})`,
			{ currentStatus, paymentStatus },
		);
	}
}

/**
 * Payment already initiated error.
 * Thrown when attempting to create a new payment for an order with existing payment.
 */
export class PaymentAlreadyInitiatedError extends AppError {
	_tag = "PaymentAlreadyInitiatedError";
	code = "PAYMENT_ALREADY_INITIATED";

	constructor(orderId: string, paymentStatus: string) {
		super(
			`Payment already initiated for this order (status: ${paymentStatus})`,
			{
				orderId,
				paymentStatus,
			},
		);
	}
}

/**
 * No checkout session error.
 * Thrown when attempting to expire a session that doesn't exist.
 */
export class NoCheckoutSessionError extends AppError {
	_tag = "NoCheckoutSessionError";
	code = "NO_CHECKOUT_SESSION";

	constructor(orderId: string) {
		super("No checkout session found for this order", { orderId });
	}
}

/**
 * Session cannot be expired error.
 * Thrown when attempting to expire a session in the wrong state.
 */
export class SessionNotExpirableError extends AppError {
	_tag = "SessionNotExpirableError";
	code = "SESSION_NOT_EXPIRABLE";

	constructor(paymentStatus: string) {
		super(`Cannot expire session - payment status is ${paymentStatus}`, {
			paymentStatus,
		});
	}
}

/**
 * Stripe operation error.
 * Wraps Stripe API errors with additional context.
 */
export class StripeOperationError extends AppError {
	_tag = "StripeOperationError";
	code = "STRIPE_OPERATION_ERROR";

	constructor(
		operation: "createSession" | "expireSession" | "getSession",
		details?: string,
	) {
		super(
			details
				? `Stripe ${operation} failed: ${details}`
				: `Stripe ${operation} failed`,
			{ operation, details },
		);
	}
}

/**
 * Union type of all order errors for type narrowing.
 */
export type OrderError =
	| InvalidOrderTransitionError
	| OrderNotCancellableError
	| OrderNotAwaitingPaymentError
	| PaymentAlreadyInitiatedError
	| NoCheckoutSessionError
	| SessionNotExpirableError
	| StripeOperationError;
