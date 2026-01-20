/**
 * Test Data Cleanup Utilities
 *
 * Cleans up test data after test runs.
 */

import { merchants } from "@menuvo/db/schema";
import { like } from "drizzle-orm";
import { getTestDb } from "../db.js";

/**
 * Cleans up test data by deleting merchants with emails matching the test run ID.
 * Related data (stores, vat_groups) is cascaded automatically via FK constraints.
 */
export async function cleanupTestData(testRunId: string): Promise<void> {
	const db = getTestDb();
	await db.delete(merchants).where(like(merchants.email, `%${testRunId}%`));
}
