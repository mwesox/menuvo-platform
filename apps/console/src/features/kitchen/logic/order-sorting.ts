/**
 * Pure functions for sorting orders in kanban columns.
 */

import type { OrderWithItems } from "@/features/orders/types";
import { FAR_AWAY_THRESHOLD_HOURS } from "../constants";
import { calculateUrgency } from "./urgency";

/**
 * Check if an order is too far away (scheduled pickup time is more than threshold hours away).
 * Dine-in orders without scheduledPickupTime are not considered "too far away".
 */
export function isOrderTooFarAway(
	order: OrderWithItems,
	now: number = Date.now(),
	thresholdHours: number = FAR_AWAY_THRESHOLD_HOURS,
): boolean {
	if (!order.scheduledPickupTime) return false; // Dine-in orders use urgency, not proximity

	const pickupTime =
		typeof order.scheduledPickupTime === "string"
			? new Date(order.scheduledPickupTime).getTime()
			: order.scheduledPickupTime.getTime();

	const hoursUntilPickup = (pickupTime - now) / (1000 * 60 * 60);
	return hoursUntilPickup > thresholdHours;
}

/**
 * Sort orders by urgency (most critical first), then by proximity (near orders first),
 * then by confirmation time (oldest first).
 * Critical orders appear at top, followed by warning, then normal.
 * Within same urgency level, near orders come before far-away orders.
 * Within same proximity, older orders come first.
 */
export function sortByUrgencyAndTime(
	orders: OrderWithItems[],
	now: number = Date.now(),
): OrderWithItems[] {
	return [...orders].sort((a, b) => {
		const urgencyA = calculateUrgency(a.confirmedAt, now);
		const urgencyB = calculateUrgency(b.confirmedAt, now);

		// Urgency priority: critical > warning > normal
		const urgencyOrder = { critical: 0, warning: 1, normal: 2 };
		const urgencyDiff = urgencyOrder[urgencyA] - urgencyOrder[urgencyB];

		if (urgencyDiff !== 0) return urgencyDiff;

		// Same urgency: prioritize orders that are NOT too far away
		const isFarAwayA = isOrderTooFarAway(a, now);
		const isFarAwayB = isOrderTooFarAway(b, now);
		if (isFarAwayA !== isFarAwayB) {
			// Near orders (false) come before far-away orders (true)
			return isFarAwayA ? 1 : -1;
		}

		// Same urgency and proximity: sort by confirmation time (oldest first)
		const timeA = a.confirmedAt
			? new Date(a.confirmedAt).getTime()
			: Number.POSITIVE_INFINITY;
		const timeB = b.confirmedAt
			? new Date(b.confirmedAt).getTime()
			: Number.POSITIVE_INFINITY;

		return timeA - timeB;
	});
}

/**
 * Sort completed orders by completion time (most recent first).
 * For the "Done" column archive view.
 */
export function sortByCompletionTime(
	orders: OrderWithItems[],
): OrderWithItems[] {
	return [...orders].sort((a, b) => {
		const timeA = a.completedAt
			? new Date(a.completedAt).getTime()
			: Number.NEGATIVE_INFINITY;
		const timeB = b.completedAt
			? new Date(b.completedAt).getTime()
			: Number.NEGATIVE_INFINITY;

		// Most recent first
		return timeB - timeA;
	});
}

/**
 * Sort orders by creation time (oldest first).
 * Simple FIFO ordering without urgency consideration.
 */
export function sortByCreationTime(orders: OrderWithItems[]): OrderWithItems[] {
	return [...orders].sort((a, b) => {
		const timeA = new Date(a.createdAt).getTime();
		const timeB = new Date(b.createdAt).getTime();
		return timeA - timeB;
	});
}
