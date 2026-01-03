import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
	categories,
	items,
	menuImportJobs,
	optionChoices,
	optionGroups,
	stores,
} from "@/db/schema";
import { applyImportChangesSchema, getImportJobStatusSchema } from "../schemas";
import type { MenuComparisonData } from "../types";

/**
 * Get import job status for polling.
 */
export const getImportJobStatus = createServerFn({ method: "GET" })
	.inputValidator(getImportJobStatusSchema)
	// @ts-expect-error - TanStack Start type inference issue with JSONB columns
	.handler(async ({ data }) => {
		const job = await db.query.menuImportJobs.findFirst({
			where: eq(menuImportJobs.id, data.jobId),
		});

		if (!job) {
			throw new Error("Import job not found");
		}

		return {
			id: job.id,
			status: job.status,
			errorMessage: job.errorMessage,
			comparisonData: job.comparisonData,
		};
	});

/**
 * Apply selected import changes to create/update menu items.
 */
export const applyImportChanges = createServerFn({ method: "POST" })
	.inputValidator(applyImportChangesSchema)
	.handler(async ({ data }) => {
		const job = await db.query.menuImportJobs.findFirst({
			where: eq(menuImportJobs.id, data.jobId),
		});

		if (!job || job.status !== "READY") {
			throw new Error("Import job not ready");
		}

		const comparison = job.comparisonData as MenuComparisonData;
		if (!comparison) {
			throw new Error("No comparison data");
		}

		// Build selection map
		const selectionMap = new Map(
			data.selections
				.filter((s) => s.action === "apply")
				.map((s) => [`${s.type}:${s.extractedName}`, true]),
		);

		// Get store for creating new items
		const store = await db.query.stores.findFirst({
			where: eq(stores.id, job.storeId),
		});
		if (!store) throw new Error("Store not found");

		// Apply category and item changes
		for (const catComp of comparison.categories) {
			const catKey = `category:${catComp.extracted.name}`;
			if (!selectionMap.has(catKey)) continue;

			let categoryId: number;

			if (catComp.action === "create") {
				// Create new category
				const [newCat] = await db
					.insert(categories)
					.values({
						storeId: job.storeId,
						translations: {
							de: {
								name: catComp.extracted.name,
								description: catComp.extracted.description,
							},
						},
					})
					.returning();
				categoryId = newCat.id;
			} else if (catComp.existingId) {
				categoryId = catComp.existingId;
			} else {
				continue;
			}

			// Apply item changes for this category
			for (const itemComp of catComp.items) {
				const itemKey = `item:${itemComp.extracted.name}`;
				if (!selectionMap.has(itemKey)) continue;

				if (itemComp.action === "create") {
					await db.insert(items).values({
						categoryId,
						storeId: job.storeId,
						price: itemComp.extracted.price,
						allergens: itemComp.extracted.allergens,
						translations: {
							de: {
								name: itemComp.extracted.name,
								description: itemComp.extracted.description,
							},
						},
					});
				} else if (itemComp.action === "update" && itemComp.existingId) {
					await db
						.update(items)
						.set({
							price: itemComp.extracted.price,
							allergens: itemComp.extracted.allergens,
							translations: {
								de: {
									name: itemComp.extracted.name,
									description: itemComp.extracted.description,
								},
							},
						})
						.where(eq(items.id, itemComp.existingId));
				}
			}
		}

		// Apply option group changes
		for (const ogComp of comparison.optionGroups) {
			const ogKey = `optionGroup:${ogComp.extracted.name}`;
			if (!selectionMap.has(ogKey)) continue;

			if (ogComp.action === "create") {
				const [newGroup] = await db
					.insert(optionGroups)
					.values({
						storeId: job.storeId,
						type: ogComp.extracted.type,
						isRequired: ogComp.extracted.isRequired,
						translations: {
							de: {
								name: ogComp.extracted.name,
								description: ogComp.extracted.description,
							},
						},
					})
					.returning();

				// Create choices
				for (const choice of ogComp.extracted.choices) {
					await db.insert(optionChoices).values({
						optionGroupId: newGroup.id,
						priceModifier: choice.priceModifier,
						translations: {
							de: { name: choice.name },
						},
					});
				}
			}
		}

		// Mark job as completed
		await db
			.update(menuImportJobs)
			.set({ status: "COMPLETED" })
			.where(eq(menuImportJobs.id, data.jobId));

		return { success: true };
	});
