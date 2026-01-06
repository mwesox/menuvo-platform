/**
 * Order-related constants and enums.
 *
 * Re-exports enum types and values from the database schema to ensure
 * a single source of truth.
 */

import type { OrderStatus, OrderType, PaymentStatus } from "@/db/schema";
import { orderStatuses, orderTypes, paymentStatuses } from "@/db/schema";

// Re-export from schema
export { orderStatuses, paymentStatuses, orderTypes };
export type { OrderStatus, PaymentStatus, OrderType };

// ============================================================================
// DISPLAY LABELS
// ============================================================================

/**
 * Order status display labels
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
	awaiting_payment: "Awaiting Payment",
	confirmed: "Confirmed",
	preparing: "Preparing",
	ready: "Ready",
	completed: "Completed",
	cancelled: "Cancelled",
} as const;

/**
 * Payment status display labels
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
	pending: "Pending",
	awaiting_confirmation: "Processing",
	paid: "Paid",
	pay_at_counter: "Pay at Counter",
	failed: "Failed",
	refunded: "Refunded",
	expired: "Expired",
} as const;

/**
 * Order type display labels
 */
export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
	dine_in: "Dine In",
	takeaway: "Takeaway",
	delivery: "Delivery",
} as const;

// ============================================================================
// STATUS GROUPS
// ============================================================================

/**
 * Order statuses visible in kitchen monitor
 */
export const KITCHEN_VISIBLE_STATUSES = [
	"confirmed",
	"preparing",
	"ready",
] as const;

/**
 * Payment statuses that allow kitchen visibility
 */
export const KITCHEN_VALID_PAYMENT_STATUSES = ["paid"] as const;

/**
 * Terminal order statuses (cannot transition further)
 */
export const TERMINAL_ORDER_STATUSES = ["completed", "cancelled"] as const;

// ============================================================================
// POLLING INTERVALS
// ============================================================================

/**
 * Polling intervals (in milliseconds)
 */
export const POLLING_INTERVALS = {
	/** Order management page polling */
	ORDERS: 30_000,
	/** Kitchen monitor polling (faster for real-time feel) */
	KITCHEN: 5_000,
	/** Customer order status page */
	CUSTOMER: 10_000,
} as const;
