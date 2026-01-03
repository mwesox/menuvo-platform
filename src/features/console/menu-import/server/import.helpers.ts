"use server";

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, menuImportJobs, optionGroups } from "@/db/schema";
import type { AllowedFileType } from "../schemas";

/**
 * Create import job record in database.
 * Called from the API route after file upload.
 *
 * NOTE: This is a server-only helper, NOT a createServerFn.
 * Only import from server contexts (API routes, workers).
 */
export async function createImportJob(params: {
	storeId: number;
	filename: string;
	fileType: AllowedFileType;
	fileKey: string;
}): Promise<{ jobId: number }> {
	const { storeId, filename, fileType, fileKey } = params;

	// Create job record
	const [job] = await db
		.insert(menuImportJobs)
		.values({
			storeId,
			originalFilename: filename,
			fileType,
			fileKey,
		})
		.returning();

	return { jobId: job.id };
}

/**
 * Get existing menu data for a store (used by job processor).
 *
 * NOTE: This is a server-only helper, NOT a createServerFn.
 * Only import from server contexts (API routes, workers).
 */
export async function getExistingMenuData(storeId: number) {
	const existingCategories = await db.query.categories.findMany({
		where: eq(categories.storeId, storeId),
		orderBy: [asc(categories.displayOrder)],
		with: {
			items: {
				orderBy: (items, { asc }) => [asc(items.displayOrder)],
			},
		},
	});

	const existingOptionGroups = await db.query.optionGroups.findMany({
		where: eq(optionGroups.storeId, storeId),
		orderBy: [asc(optionGroups.displayOrder)],
	});

	// Transform to comparison format
	return {
		categories: existingCategories.map((cat) => ({
			id: cat.id,
			name:
				(cat.translations as Record<string, { name?: string }>)?.de?.name || "",
			description: (
				cat.translations as Record<string, { description?: string }>
			)?.de?.description,
			items: cat.items.map((item) => ({
				id: item.id,
				name:
					(item.translations as Record<string, { name?: string }>)?.de?.name ||
					"",
				description: (
					item.translations as Record<string, { description?: string }>
				)?.de?.description,
				price: item.price,
				allergens: item.allergens,
			})),
		})),
		optionGroups: existingOptionGroups.map((og) => ({
			id: og.id,
			name:
				(og.translations as Record<string, { name?: string }>)?.de?.name || "",
			description: (og.translations as Record<string, { description?: string }>)
				?.de?.description,
			type: og.type,
		})),
	};
}
