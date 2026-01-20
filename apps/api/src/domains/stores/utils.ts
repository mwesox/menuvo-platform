/**
 * Store Utilities
 *
 * Pure utility functions for store operations.
 */

import type { Database } from "@menuvo/db";
import { stores } from "@menuvo/db/schema";
import slugify from "@sindresorhus/slugify";
import { and, eq, ne } from "drizzle-orm";

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
