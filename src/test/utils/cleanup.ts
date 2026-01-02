/**
 * Cleanup utilities for test data.
 * Handles cleanup in correct order to respect foreign keys.
 */

import { and, inArray, like, lt } from "drizzle-orm";
import { merchants, orders } from "@/db/schema";
import { testDb } from "../db";

/**
 * Clean up test data created by a specific test run.
 * Deletes in correct order to handle foreign keys:
 * 1. Delete orders (FK to stores without cascade)
 * 2. Delete merchants (cascades to stores, categories, items, etc.)
 */
export async function cleanupTestData(testRunId: string): Promise<void> {
	const testMerchants = await testDb.query.merchants.findMany({
		where: like(merchants.email, `%${testRunId}%`),
		columns: { id: true },
		with: {
			stores: {
				columns: { id: true },
			},
		},
	});

	if (testMerchants.length > 0) {
		// Get all store IDs for these merchants
		const storeIds = testMerchants.flatMap((m) => m.stores.map((s) => s.id));

		// Delete orders first (no cascade from stores)
		if (storeIds.length > 0) {
			await testDb.delete(orders).where(inArray(orders.storeId, storeIds));
		}

		// Now delete merchants (cascades to stores, categories, items, etc.)
		const merchantIds = testMerchants.map((m) => m.id);
		await testDb.delete(merchants).where(inArray(merchants.id, merchantIds));
	}
}

/**
 * Clean up all test data older than specified hours.
 * Useful for periodic cleanup to prevent test DB bloat.
 */
export async function cleanupOldTestData(hoursOld = 24): Promise<void> {
	const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

	await testDb
		.delete(merchants)
		.where(
			and(
				like(merchants.email, "%@test.menuvo.local"),
				lt(merchants.createdAt, cutoff),
			),
		);
}
