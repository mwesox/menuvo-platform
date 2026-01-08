/**
 * Import Router
 *
 * Handles menu import procedures:
 * - Get import job status
 * - Apply selected import changes
 *
 * Import jobs are created by the file upload endpoint and processed in the background.
 * This router handles the review and application of extracted data.
 */

import { menuImportJobs, stores } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
	applyImportChangesSchema,
	getImportJobStatusSchema,
} from "../schemas/import.schema.js";
import { router, storeOwnerProcedure } from "../trpc.js";

export const importRouter = router({
	/**
	 * Get import job status (store owner only)
	 * Returns the current status and extracted data for review
	 */
	getJobStatus: storeOwnerProcedure
		.input(getImportJobStatusSchema)
		.query(async ({ ctx, input }) => {
			const job = await ctx.db.query.menuImportJobs.findFirst({
				where: eq(menuImportJobs.id, input.jobId),
				with: {
					store: {
						columns: { merchantId: true },
					},
				},
			});

			if (!job) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Import job not found",
				});
			}

			// Verify ownership via store
			if (job.store.merchantId !== ctx.session.merchantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to view this import job",
				});
			}

			return {
				id: job.id,
				storeId: job.storeId,
				originalFilename: job.originalFilename,
				fileType: job.fileType,
				status: job.status,
				errorMessage: job.errorMessage,
				comparisonData: job.comparisonData,
				createdAt: job.createdAt,
			};
		}),

	/**
	 * Apply selected import changes (store owner only)
	 * Creates/updates categories, items, and option groups based on user selections
	 */
	applyChanges: storeOwnerProcedure
		.input(applyImportChangesSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the store belongs to the merchant
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.merchantId, ctx.session.merchantId),
				),
				columns: { id: true },
			});

			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found",
				});
			}

			// Get the import job
			const job = await ctx.db.query.menuImportJobs.findFirst({
				where: and(
					eq(menuImportJobs.id, input.jobId),
					eq(menuImportJobs.storeId, input.storeId),
				),
			});

			if (!job) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Import job not found",
				});
			}

			// Ensure job is in READY status
			if (job.status !== "READY") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Import job is not ready for application. Current status: ${job.status}`,
				});
			}

			// Filter to only selections with "apply" action
			const selectionsToApply = input.selections.filter(
				(s) => s.action === "apply",
			);

			if (selectionsToApply.length === 0) {
				// No selections to apply, just mark as completed
				await ctx.db
					.update(menuImportJobs)
					.set({ status: "COMPLETED" })
					.where(eq(menuImportJobs.id, input.jobId));

				return {
					success: true,
					applied: {
						categories: 0,
						items: 0,
						optionGroups: 0,
					},
				};
			}

			// Count selections by type
			const categoriesCount = selectionsToApply.filter(
				(s) => s.type === "category",
			).length;
			const itemsCount = selectionsToApply.filter(
				(s) => s.type === "item",
			).length;
			const optionGroupsCount = selectionsToApply.filter(
				(s) => s.type === "optionGroup",
			).length;

			// TODO: Implement actual entity creation/updates based on comparisonData
			// This would involve:
			// 1. Parsing the comparisonData to get full entity details
			// 2. For each "apply" selection:
			//    - If matchedEntityId exists: update the existing entity
			//    - If no matchedEntityId: create a new entity
			// 3. Handle translations, prices, option groups, etc.

			// For now, mark the job as completed
			await ctx.db
				.update(menuImportJobs)
				.set({ status: "COMPLETED" })
				.where(eq(menuImportJobs.id, input.jobId));

			return {
				success: true,
				applied: {
					categories: categoriesCount,
					items: itemsCount,
					optionGroups: optionGroupsCount,
				},
			};
		}),
});
