import type Stripe from "stripe";
import type { V1EventType, V2EventType } from "../schemas";

// ============================================
// Handler Types
// ============================================

/**
 * Handler for V1 snapshot events.
 * Receives the full Stripe event.
 */
type V1Handler = (event: Stripe.Event) => Promise<void>;

/**
 * Handler for V2 thin events.
 * Receives the event type and raw payload (thin events require API fetch for full data).
 */
type V2Handler = (
	eventType: V2EventType,
	payload: Record<string, unknown>,
) => Promise<void>;

// ============================================
// Handler Registries
// ============================================

const v1Handlers = new Map<V1EventType, V1Handler>();
const v2Handlers = new Map<V2EventType, V2Handler>();

// ============================================
// Registration Functions
// ============================================

/**
 * Register a handler for a V1 snapshot event type.
 * Called at module load time by handler files.
 *
 * @example
 * registerV1Handler("customer.subscription.created", async (event) => {
 *   const subscription = event.data.object as Stripe.Subscription;
 *   // Handle subscription...
 * });
 */
export function registerV1Handler(
	eventType: V1EventType,
	handler: V1Handler,
): void {
	v1Handlers.set(eventType, handler);
}

/**
 * Register a handler for a V2 thin event type.
 * Called at module load time by handler files.
 *
 * @example
 * registerV2Handler("v2.core.account[requirements].updated", async (eventType, payload) => {
 *   const accountId = payload.related_object?.id;
 *   // Fetch full account data from Stripe API...
 * });
 */
export function registerV2Handler(
	eventType: V2EventType,
	handler: V2Handler,
): void {
	v2Handlers.set(eventType, handler);
}

// ============================================
// Dispatch Functions
// ============================================

/**
 * Dispatch a V1 event to its registered handler.
 * Returns the handler promise if found, undefined otherwise.
 */
export function dispatchV1Event(
	event: Stripe.Event,
): Promise<void> | undefined {
	const handler = v1Handlers.get(event.type as V1EventType);
	return handler?.(event);
}

/**
 * Dispatch a V2 event to its registered handler.
 * Returns the handler promise if found, undefined otherwise.
 */
export function dispatchV2Event(
	eventType: V2EventType,
	payload: Record<string, unknown>,
): Promise<void> | undefined {
	const handler = v2Handlers.get(eventType);
	return handler?.(eventType, payload);
}

// ============================================
// Debug Utilities
// ============================================

/**
 * Get all registered V1 event types (for debugging/logging).
 */
export function getRegisteredV1Events(): V1EventType[] {
	return Array.from(v1Handlers.keys());
}

/**
 * Get all registered V2 event types (for debugging/logging).
 */
export function getRegisteredV2Events(): V2EventType[] {
	return Array.from(v2Handlers.keys());
}
