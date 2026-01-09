import type { OrderStatus, PaymentStatus } from "@menuvo/db/schema";

/**
 * Result of mapping a Mollie payment status to order statuses.
 */
export type StatusMappingResult = {
	orderStatus: OrderStatus;
	paymentStatus: PaymentStatus;
};

/**
 * Map a Mollie payment status to our order and payment statuses.
 *
 * Mollie payment statuses: open, pending, authorized, paid, expired, failed, canceled
 * Our order statuses: pending, awaiting_payment, confirmed, preparing, ready, completed, cancelled
 * Our payment statuses: pending, awaiting_confirmation, paid, failed, refunded, expired
 *
 * @param mollieStatus - The payment status from Mollie
 * @returns The mapped order and payment statuses, or null if no update needed
 */
export function mapMolliePaymentStatus(
	mollieStatus: string,
): StatusMappingResult | null {
	switch (mollieStatus) {
		case "paid":
			return {
				orderStatus: "confirmed",
				paymentStatus: "paid",
			};

		case "failed":
		case "canceled":
			return {
				orderStatus: "cancelled",
				paymentStatus: "failed",
			};

		case "expired":
			return {
				orderStatus: "cancelled",
				paymentStatus: "expired",
			};

		// Statuses that don't require order updates
		case "open":
		case "pending":
		case "authorized":
			return null;

		default:
			return null;
	}
}

/**
 * Check if a Mollie payment status represents a terminal state.
 * Terminal states are final and won't change.
 */
export function isTerminalPaymentStatus(mollieStatus: string): boolean {
	return ["paid", "failed", "canceled", "expired"].includes(mollieStatus);
}

/**
 * Check if a Mollie payment status represents a successful payment.
 */
export function isSuccessfulPaymentStatus(mollieStatus: string): boolean {
	return mollieStatus === "paid";
}
