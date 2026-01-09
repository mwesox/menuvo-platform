// ============================================
// Mollie Event Types
// ============================================

/**
 * Known Mollie webhook event types.
 * Mollie sends webhooks for various resource state changes.
 */
export type MollieEventType =
	// Payment events
	| "payment.paid"
	| "payment.failed"
	| "payment.expired"
	| "payment.canceled"
	// Refund events
	| "refund.settled"
	| "refund.failed"
	// Subscription events
	| "subscription.created"
	| "subscription.updated"
	| "subscription.canceled"
	| "subscription.suspended"
	| "subscription.resumed";

// ============================================
// Handler Types
// ============================================

/**
 * Handler for Mollie webhook events.
 * Receives the event type, resource ID, and raw payload.
 *
 * Note: Mollie webhooks are "thin" - they only contain the resource ID.
 * Handlers must fetch the full resource data from the Mollie API.
 */
export type MollieHandler = (
	eventType: MollieEventType,
	resourceId: string,
	payload: Record<string, unknown>,
) => Promise<void>;

// ============================================
// Handler Registry
// ============================================

const handlers = new Map<MollieEventType, MollieHandler>();

// ============================================
// Registration Function
// ============================================

/**
 * Register a handler for a Mollie event type.
 * Called at module load time by handler files.
 *
 * @example
 * registerMollieHandler("payment.paid", async (eventType, resourceId, payload) => {
 *   // Fetch payment from Mollie API using resourceId
 *   const payment = await mollieClient.payments.get(resourceId);
 *   // Handle payment...
 * });
 */
export function registerMollieHandler(
	eventType: MollieEventType,
	handler: MollieHandler,
): void {
	handlers.set(eventType, handler);
}

// ============================================
// Dispatch Function
// ============================================

/**
 * Dispatch a Mollie event to its registered handler.
 * Returns the handler promise if found, undefined otherwise.
 */
export function dispatchMollieEvent(
	eventType: MollieEventType,
	resourceId: string,
	payload: Record<string, unknown>,
): Promise<void> | undefined {
	const handler = handlers.get(eventType);
	return handler?.(eventType, resourceId, payload);
}

// ============================================
// Debug Utilities
// ============================================

/**
 * Get all registered Mollie event types (for debugging/logging).
 */
export function getRegisteredMollieEvents(): MollieEventType[] {
	return Array.from(handlers.keys());
}
