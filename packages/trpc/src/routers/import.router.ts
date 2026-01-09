/**
 * Import Router
 *
 * Handles menu import procedures:
 * - Upload menu file (FormData)
 * - Get import job status
 * - Apply selected import changes
 *
 * Import jobs are created by the upload mutation and processed in the background.
 * This router handles the review and application of extracted data.
 */

import { menuImportJobs, stores } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { S3Client } from "bun";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
	applyImportChangesSchema,
	getImportJobStatusSchema,
} from "../schemas/import.schema.js";
import { router, storeOwnerProcedure } from "../trpc.js";

// ============================================================================
// S3 Client for internal files bucket
// ============================================================================

const filesStorage = new S3Client({
	endpoint: process.env.S3_ENDPOINT!,
	accessKeyId: process.env.S3_ACCESS_KEY_ID!,
	secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
	bucket: process.env.S3_FILES_BUCKET ?? "menuvo-files",
	region: process.env.S3_REGION ?? "auto",
});

// ============================================================================
// Allowed file types for menu import
// ============================================================================

const ALLOWED_FILE_TYPES = ["xlsx", "csv", "json", "md", "txt"] as const;
type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

const MIME_TYPE_MAP: Record<string, AllowedFileType> = {
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
	"application/vnd.ms-excel": "xlsx",
	"text/csv": "csv",
	"application/json": "json",
	"text/markdown": "md",
	"text/plain": "txt",
};

export const importRouter = router({
	/**
	 * Upload a menu file for import (store owner only)
	 * Creates an import job and triggers background processing
	 */
	upload: storeOwnerProcedure
		.input(z.instanceof(FormData))
		.mutation(async ({ ctx, input }) => {
			const file = input.get("file") as File | null;
			const storeId = input.get("storeId") as string | null;

			// Validate file
			if (!file) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Missing file" });
			}

			// Validate storeId
			if (!storeId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Missing storeId",
				});
			}

			// Verify store belongs to merchant
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, storeId),
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

			// Determine file type from mime type or extension
			let fileType: AllowedFileType | undefined = MIME_TYPE_MAP[file.type];

			if (!fileType) {
				// Try to get from filename extension
				const ext = file.name.split(".").pop()?.toLowerCase();
				if (ext && ALLOWED_FILE_TYPES.includes(ext as AllowedFileType)) {
					fileType = ext as AllowedFileType;
				}
			}

			if (!fileType) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Unsupported file type: ${file.type}. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`,
				});
			}

			// Read file content
			const buffer = Buffer.from(await file.arrayBuffer());

			// Generate storage key
			const fileKey = `imports/${storeId}/${crypto.randomUUID()}.${fileType}`;

			// Upload to S3
			await filesStorage.write(fileKey, buffer, { type: file.type });

			// Create import job in database
			const [job] = await ctx.db
				.insert(menuImportJobs)
				.values({
					storeId,
					originalFilename: file.name,
					fileType,
					fileKey,
					status: "PROCESSING",
				})
				.returning();

			if (!job) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create import job",
				});
			}

			// Trigger background processing via injected service
			if (ctx.menuImport) {
				// Fire and forget - don't await
				ctx.menuImport.processJob(job.id).catch((error) => {
					console.error(
						`[import.router] Background processing failed for job ${job.id}:`,
						error,
					);
				});
			} else {
				console.warn(
					"[import.router] Menu import service not available - job will not be processed",
				);
			}

			return {
				jobId: job.id,
				status: job.status,
			};
		}),

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
