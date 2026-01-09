import { db } from "@menuvo/db";
import { mollieEvents, type ProcessingStatus } from "@menuvo/db/schema";
import { eq, sql } from "drizzle-orm";

export type IngestEventInput = {
	eventType: string;
	resourceId: string;
	resourceType: string;
	merchantId: string | null;
	payload: Record<string, unknown>;
};

export type IngestEventOutput = {
	isNew: boolean;
	eventId: string;
};

/**
 * Generate a unique event ID for Mollie webhooks.
 * Mollie doesn't send event IDs, so we generate them using resourceId and timestamp.
 * Format: mol_evt_{resourceId}_{timestamp}
 */
function generateEventId(resourceId: string): string {
	return `mol_evt_${resourceId}_${Date.now()}`;
}

/**
 * Ingest a Mollie webhook event.
 * Provides idempotency via ON CONFLICT DO NOTHING - duplicates are silently skipped.
 * Events are saved with PENDING status for subsequent processing.
 *
 * Note: Since Mollie doesn't send event IDs, we generate a unique ID based on
 * the resourceId and timestamp. This means rapid-fire webhooks for the same
 * resource will create separate events (which is correct behavior for Mollie).
 */
export async function ingestMollieEvent(
	input: IngestEventInput,
): Promise<IngestEventOutput> {
	const eventId = generateEventId(input.resourceId);

	// Single atomic insert with conflict handling
	// RETURNING only returns rows that were actually inserted
	const result = await db
		.insert(mollieEvents)
		.values({
			id: eventId,
			eventType: input.eventType,
			resourceId: input.resourceId,
			resourceType: input.resourceType,
			merchantId: input.merchantId,
			payload: input.payload,
		})
		.onConflictDoNothing({ target: mollieEvents.id })
		.returning({ id: mollieEvents.id });

	return { isNew: result.length > 0, eventId };
}

/**
 * Update the processing status of a Mollie event.
 */
async function updateEventStatus(
	eventId: string,
	status: ProcessingStatus,
): Promise<void> {
	const processedAt =
		status === "PROCESSED" || status === "FAILED" ? new Date() : null;

	await db
		.update(mollieEvents)
		.set({
			processingStatus: status,
			processedAt,
		})
		.where(eq(mollieEvents.id, eventId));
}

export async function markEventProcessed(eventId: string): Promise<void> {
	await updateEventStatus(eventId, "PROCESSED");
}

export async function markEventFailed(eventId: string): Promise<void> {
	await updateEventStatus(eventId, "FAILED");
}

/**
 * Get a Mollie event by its ID.
 */
export async function getEventById(eventId: string) {
	return db.query.mollieEvents.findFirst({
		where: eq(mollieEvents.id, eventId),
	});
}

/**
 * Increment the retry count for a Mollie event.
 */
export async function incrementRetryCount(eventId: string) {
	await db
		.update(mollieEvents)
		.set({ retryCount: sql`${mollieEvents.retryCount} + 1` })
		.where(eq(mollieEvents.id, eventId));
}

/**
 * Get the retry count for a Mollie event.
 */
export async function getRetryCount(eventId: string): Promise<number> {
	const event = await db.query.mollieEvents.findFirst({
		where: eq(mollieEvents.id, eventId),
		columns: { retryCount: true },
	});
	return event?.retryCount ?? 0;
}
