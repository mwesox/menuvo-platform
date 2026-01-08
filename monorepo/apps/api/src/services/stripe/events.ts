import { db } from "@menuvo/db";
import { type ProcessingStatus, stripeEvents } from "@menuvo/db/schema";
import { eq, sql } from "drizzle-orm";

export type IngestEventInput = {
	eventId: string;
	eventType: string;
	apiVersion: string | null;
	stripeCreatedAt: Date;
	stripeAccountId: string | null;
	payload: Record<string, unknown>;
};

export type IngestEventOutput = {
	isNew: boolean;
	eventId: string;
};

/**
 * Extract object ID and type from event payload.
 * Works for both V1 (data.object) and V2 (related_object) formats.
 */
function extractMetadata(payload: Record<string, unknown>): {
	objectId: string | null;
	objectType: string | null;
} {
	// V1 format: data.object.id and data.object.object
	const data = payload.data as Record<string, unknown> | undefined;
	if (data?.object) {
		const obj = data.object as Record<string, unknown>;
		return {
			objectId: (obj.id as string) ?? null,
			objectType: (obj.object as string) ?? null,
		};
	}

	// V2 thin event format: related_object.id and related_object.type
	const relatedObject = payload.related_object as
		| Record<string, unknown>
		| undefined;
	if (relatedObject) {
		return {
			objectId: (relatedObject.id as string) ?? null,
			objectType: (relatedObject.type as string) ?? null,
		};
	}

	return { objectId: null, objectType: null };
}

/**
 * Ingest a Stripe webhook event.
 * Provides idempotency via ON CONFLICT DO NOTHING - duplicates are silently skipped.
 * Events are saved with PENDING status for subsequent processing.
 *
 * ALL events are stored without filtering.
 */
export async function ingestStripeEvent(
	input: IngestEventInput,
): Promise<IngestEventOutput> {
	const { objectId, objectType } = extractMetadata(input.payload);

	// Single atomic insert with conflict handling
	// RETURNING only returns rows that were actually inserted
	const result = await db
		.insert(stripeEvents)
		.values({
			id: input.eventId,
			eventType: input.eventType,
			apiVersion: input.apiVersion,
			stripeCreatedAt: input.stripeCreatedAt,
			stripeAccountId: input.stripeAccountId,
			objectId,
			objectType,
			payload: input.payload,
		})
		.onConflictDoNothing({ target: stripeEvents.id })
		.returning({ id: stripeEvents.id });

	return { isNew: result.length > 0, eventId: input.eventId };
}

/**
 * Update the processing status of a Stripe event.
 */
async function updateEventStatus(
	eventId: string,
	status: ProcessingStatus,
): Promise<void> {
	const processedAt =
		status === "PROCESSED" || status === "FAILED" ? new Date() : null;

	await db
		.update(stripeEvents)
		.set({
			processingStatus: status,
			processedAt,
		})
		.where(eq(stripeEvents.id, eventId));
}

export async function markEventProcessed(eventId: string): Promise<void> {
	await updateEventStatus(eventId, "PROCESSED");
}

export async function markEventFailed(eventId: string): Promise<void> {
	await updateEventStatus(eventId, "FAILED");
}

/**
 * Get a Stripe event by its ID.
 */
export async function getEventById(eventId: string) {
	return db.query.stripeEvents.findFirst({
		where: eq(stripeEvents.id, eventId),
	});
}

/**
 * Increment the retry count for a Stripe event.
 */
export async function incrementRetryCount(eventId: string) {
	await db
		.update(stripeEvents)
		.set({ retryCount: sql`${stripeEvents.retryCount} + 1` })
		.where(eq(stripeEvents.id, eventId));
}

/**
 * Get the retry count for a Stripe event.
 */
export async function getRetryCount(eventId: string): Promise<number> {
	const event = await db.query.stripeEvents.findFirst({
		where: eq(stripeEvents.id, eventId),
		columns: { retryCount: true },
	});
	return event?.retryCount ?? 0;
}
