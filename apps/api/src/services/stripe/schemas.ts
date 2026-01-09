import { z } from "zod";

// ============================================
// V1 Snapshot Event Types
// ============================================

/**
 * V1 event types that we handle in this application.
 * These are "snapshot" events with full payload from Stripe webhooks.
 */
export const V1EventType = z.enum([
	// Checkout events
	"checkout.session.completed",
	"checkout.session.expired",
	// Subscription events
	"customer.subscription.created",
	"customer.subscription.updated",
	"customer.subscription.deleted",
	"customer.subscription.paused",
	"customer.subscription.resumed",
	"customer.subscription.trial_will_end",
]);

export type V1EventType = z.infer<typeof V1EventType>;

// ============================================
// V2 Thin Event Types
// ============================================

/**
 * V2 event types that we handle in this application.
 * These are "thin" events with minimal payload - full data fetched from Stripe API.
 */
export const V2EventType = z.enum([
	"v2.core.account[requirements].updated",
	"v2.core.account[configuration.merchant].capability_status_updated",
]);

export type V2EventType = z.infer<typeof V2EventType>;

// ============================================
// Combined Event Types
// ============================================

export const EventType = z.union([V1EventType, V2EventType]);
export type EventType = z.infer<typeof EventType>;

// ============================================
// Type Guards
// ============================================

/**
 * Check if an event type is a V1 snapshot event we handle.
 */
export function isV1Event(type: string): type is V1EventType {
	return V1EventType.safeParse(type).success;
}

/**
 * Check if an event type is a V2 thin event we handle.
 */
export function isV2Event(type: string): type is V2EventType {
	return V2EventType.safeParse(type).success;
}

/**
 * Check if an event type is any event we handle (V1 or V2).
 */
export function isHandledEvent(type: string): type is EventType {
	return EventType.safeParse(type).success;
}

// ============================================
// Thin Event Payload Schema
// ============================================

/**
 * Schema for V2 thin event payloads received from Stripe webhooks.
 * Thin events contain minimal data - the related object ID is used to
 * fetch full data from the Stripe API.
 */
export const ThinEventPayloadSchema = z.object({
	id: z.string().startsWith("evt_"),
	type: V2EventType,
	created: z.string(),
	related_object: z
		.object({
			id: z.string(),
			type: z.string(),
			url: z.string(),
		})
		.optional(),
});

export type ThinEventPayload = z.infer<typeof ThinEventPayloadSchema>;
