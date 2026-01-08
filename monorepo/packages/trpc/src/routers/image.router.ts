/**
 * Image Router
 *
 * Handles image-related procedures:
 * - Image retrieval
 * - Image deletion (including S3 cleanup via injected storage service)
 * - Image record creation
 */

import { images } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
	createImageRecordSchema,
	deleteImageSchema,
	getImageSchema,
} from "../schemas/index.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

// ============================================================================
// Router
// ============================================================================

export const imageRouter = router({
	/**
	 * Get an image by ID (public)
	 * Returns null if image not found
	 */
	getById: publicProcedure
		.input(getImageSchema)
		.query(async ({ ctx, input }) => {
			const record = await ctx.db.query.images.findFirst({
				where: eq(images.id, input.imageId),
			});
			return record ?? null;
		}),

	/**
	 * Delete an image and all its variants from S3 and database.
	 *
	 * Steps:
	 * 1. Verify image exists and belongs to merchant
	 * 2. Delete S3 files (original + variants) via storage service
	 * 3. Delete database record
	 *
	 * Note: If S3 deletion partially fails, we still delete the DB record
	 * to avoid orphaned records. S3 files can be cleaned up later.
	 */
	delete: protectedProcedure
		.input(deleteImageSchema)
		.mutation(async ({ ctx, input }) => {
			// Fetch record and verify ownership
			const record = await ctx.db.query.images.findFirst({
				where: and(
					eq(images.id, input.imageId),
					eq(images.merchantId, input.merchantId),
				),
			});

			if (!record) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Image not found or access denied",
				});
			}

			// Delete S3 files if storage service is available
			let s3Result: {
				deleted: string[];
				failed: string[];
				notFound: string[];
			} | null = null;

			if (ctx.storage) {
				try {
					s3Result = await ctx.storage.deleteImageVariants(record.key);
				} catch (error) {
					// Log the error but continue with DB deletion
					// Orphaned S3 files can be cleaned up later via lifecycle policies
					console.error("[image.router] S3 deletion failed:", error);
				}
			}

			// Delete database record
			await ctx.db.delete(images).where(eq(images.id, input.imageId));

			return {
				success: true,
				s3Result,
			};
		}),

	/**
	 * Create an image record in the database.
	 *
	 * This procedure only handles metadata storage - actual file upload
	 * to S3 should be done separately (typically via presigned URLs or
	 * direct upload endpoint).
	 */
	createRecord: protectedProcedure
		.input(createImageRecordSchema)
		.mutation(async ({ ctx, input }) => {
			// SECURITY: Verify merchantId matches session to prevent creating images for other merchants
			if (input.merchantId !== ctx.session.merchantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Cannot create images for another merchant",
				});
			}

			const [record] = await ctx.db
				.insert(images)
				.values({
					merchantId: ctx.session.merchantId, // Use session merchantId, not input
					type: input.type,
					key: input.key,
					originalUrl: input.originalUrl,
					thumbnailUrl: input.thumbnailUrl,
					filename: input.filename,
					mimeType: input.mimeType,
					sizeBytes: input.sizeBytes,
					width: input.width,
					height: input.height,
				})
				.returning();

			return record;
		}),
});
