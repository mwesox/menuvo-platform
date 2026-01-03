/**
 * Pure functions for order status management.
 * Handles status transitions and visibility rules.
 */

import {
	KITCHEN_VALID_PAYMENT_STATUSES,
	KITCHEN_VISIBLE_STATUSES,
	type OrderStatus,
	type PaymentStatus,
	TERMINAL_ORDER_STATUSES,
} from "../constants";

/**
 * Valid status transitions for orders
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	awaiting_payment: ["confirmed", "cancelled"],
	confirmed: ["preparing", "cancelled"],
	preparing: ["ready", "cancelled"],
	ready: ["completed", "cancelled"],
	completed: [],
	cancelled: [],
};

/**
 * Check if a status transition is valid
 */
export function canTransitionTo(from: OrderStatus, to: OrderStatus): boolean {
	return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get all valid next statuses from current status
 */
export function getNextValidStatuses(current: OrderStatus): OrderStatus[] {
	return VALID_TRANSITIONS[current] ?? [];
}

/**
 * Check if an order status is terminal (cannot change)
 */
export function isTerminalStatus(status: OrderStatus): boolean {
	return (TERMINAL_ORDER_STATUSES as readonly string[]).includes(status);
}

/**
 * Check if an order should be visible in the kitchen monitor
 * Kitchen only sees paid orders that are being worked on
 */
export function isKitchenVisible(order: {
	status: OrderStatus;
	paymentStatus: PaymentStatus;
}): boolean {
	const validPayment = (
		KITCHEN_VALID_PAYMENT_STATUSES as readonly string[]
	).includes(order.paymentStatus);
	const validStatus = (KITCHEN_VISIBLE_STATUSES as readonly string[]).includes(
		order.status,
	);
	return validPayment && validStatus;
}

/**
 * Check if an order can be cancelled
 * Cannot cancel completed or already cancelled orders
 */
export function canCancelOrder(status: OrderStatus): boolean {
	return !isTerminalStatus(status);
}

/**
 * Check if a payment status allows the order to proceed
 */
export function isPaymentComplete(paymentStatus: PaymentStatus): boolean {
	return paymentStatus === "paid" || paymentStatus === "pay_at_counter";
}

/**
 * Check if an order is awaiting payment
 */
export function isAwaitingPayment(order: {
	status: OrderStatus;
	paymentStatus: PaymentStatus;
}): boolean {
	return (
		order.status === "awaiting_payment" &&
		(order.paymentStatus === "pending" ||
			order.paymentStatus === "awaiting_confirmation")
	);
}

/**
 * Get the appropriate next status after payment confirmation
 */
export function getStatusAfterPayment(currentStatus: OrderStatus): OrderStatus {
	if (currentStatus === "awaiting_payment") {
		return "confirmed";
	}
	return currentStatus;
}

/**
 * Determine initial order status based on order type and payment method.
 * Currently all orders require online payment.
 */
export function getInitialOrderStatus(
	_orderType: string,
	_paymentMethod: string,
): { orderStatus: OrderStatus; paymentStatus: PaymentStatus } {
	// All orders require online payment for now
	return {
		orderStatus: "awaiting_payment",
		paymentStatus: "pending",
	};
}

/**
 * Get display color for order status (for UI)
 */
export function getStatusColor(
	status: OrderStatus,
): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "awaiting_payment":
			return "secondary";
		case "confirmed":
			return "default";
		case "preparing":
			return "default";
		case "ready":
			return "default";
		case "completed":
			return "outline";
		case "cancelled":
			return "destructive";
		default:
			return "default";
	}
}

/**
 * Get display color for payment status (for UI)
 */
export function getPaymentStatusColor(
	status: PaymentStatus,
): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "pending":
			return "secondary";
		case "awaiting_confirmation":
			return "secondary";
		case "paid":
			return "default";
		case "pay_at_counter":
			return "outline";
		case "failed":
			return "destructive";
		case "refunded":
			return "outline";
		case "expired":
			return "destructive";
		default:
			return "default";
	}
}
