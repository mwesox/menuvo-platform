/**
 * Store Utilities
 *
 * Pure utility functions for store operations.
 */

import type { Database } from "@menuvo/db";
import type { StoreClosuresConfig, StoreHoursConfig } from "@menuvo/db/schema";
import { stores } from "@menuvo/db/schema";
import slugify from "@sindresorhus/slugify";
import { and, eq, ne } from "drizzle-orm";

// ============================================================================
// Hours & Closures Sorting
// ============================================================================

/**
 * Day order for sorting hours (Monday to Sunday)
 */
export const DAY_ORDER = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
] as const;

/**
 * Sort hours by day of week and display order
 */
export function sortHours<T extends StoreHoursConfig[number]>(hours: T[]): T[] {
	return [...hours].sort((a, b) => {
		const dayDiff =
			DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
		if (dayDiff !== 0) return dayDiff;
		return a.displayOrder - b.displayOrder;
	});
}

/**
 * Sort closures by start date
 */
export function sortClosures<T extends StoreClosuresConfig[number]>(
	closures: T[],
): T[] {
	return [...closures].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

// ============================================================================
// Slug Utilities
// ============================================================================

/**
 * Generate a URL-safe slug from a store name.
 * Pure function - no database access.
 */
export function generateSlug(name: string): string {
	return slugify(name);
}

/**
 * Find a unique slug by appending incremental suffixes if needed.
 *
 * @param db - Database instance
 * @param baseSlug - The base slug to start with
 * @param excludeStoreId - Optional store ID to exclude (for updates)
 */
export async function findUniqueSlug(
	db: Database,
	baseSlug: string,
	excludeStoreId?: string,
): Promise<string> {
	let slug = baseSlug;
	let counter = 1;

	while (true) {
		const whereClause = excludeStoreId
			? and(eq(stores.slug, slug), ne(stores.id, excludeStoreId))
			: eq(stores.slug, slug);

		const existing = await db.query.stores.findFirst({
			where: whereClause,
			columns: { id: true },
		});

		if (!existing) break;
		slug = `${baseSlug}-${counter}`;
		counter++;
	}

	return slug;
}
