/**
 * Error Handling Utilities
 *
 * Provides error types and handling utilities for the shop application.
 */

/**
 * Base error class for shop-specific errors
 */
export class ShopError extends Error {
	code: string;

	constructor(message: string, code: string) {
		super(message);
		this.name = "ShopError";
		this.code = code;
	}
}

/**
 * Generic application error with context data
 */
export class AppError extends Error {
	_tag: string;
	code: string;
	context?: Record<string, unknown>;

	constructor(message: string, context?: Record<string, unknown>) {
		super(message);
		this.name = "AppError";
		this._tag = "AppError";
		this.code = "APP_ERROR";
		this.context = context;
	}
}

/**
 * Order-related error
 */
export class OrderError extends ShopError {
	orderId?: string;

	constructor(message: string, orderId?: string) {
		super(message, "ORDER_ERROR");
		this.name = "OrderError";
		this.orderId = orderId;
	}
}

/**
 * Payment-related error
 */
export class PaymentError extends ShopError {
	paymentId?: string;

	constructor(message: string, paymentId?: string) {
		super(message, "PAYMENT_ERROR");
		this.name = "PaymentError";
		this.paymentId = paymentId;
	}
}

/**
 * Store unavailable error
 */
export class StoreUnavailableError extends ShopError {
	constructor(message = "Store is currently unavailable") {
		super(message, "STORE_UNAVAILABLE");
		this.name = "StoreUnavailableError";
	}
}
