/**
 * Image Router
 *
 * Handles image-related procedures:
 * - Image upload (FormData) - via images domains service
 * - Image retrieval
 * - Image deletion (including S3 cleanup via images domains service)
 * - Image record creation
 */

import { images } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	protectedProcedure,
	publicProcedure,
	router,
} from "../../trpc/trpc.js";
import type { ImageType } from "./schemas.js";
import {
	createImageRecordSchema,
	deleteImageSchema,
	getImageSchema,
	imageType,
} from "./schemas.js";

export const imageRouter = router({
	/**
	 * Upload an image via FormData
	 * Uses images domains service for processing and storage
	 */
	upload: protectedProcedure
		.input(z.instanceof(FormData))
		.mutation(async ({ ctx, input }) => {
			const file = input.get("file") as File | null;
			const merchantId = input.get("merchantId") as string | null;
			const type = input.get("type") as string | null;
			const filename = (input.get("filename") as string) || "image";

			if (!file) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Missing file" });
			}
			if (!merchantId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Missing merchantId",
				});
			}
			if (!type || !imageType.includes(type as ImageType)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid image type",
				});
			}

			const buffer = new Uint8Array(await file.arrayBuffer());

			try {
				return await ctx.services.images.uploadImage(ctx.session.merchantId, {
					buffer,
					merchantId,
					type: type as ImageType,
					filename,
					mimeType: file.type || "image/jpeg",
				});
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("another merchant")) {
						throw new TRPCError({ code: "FORBIDDEN", message: error.message });
					}
					if (
						error.message.includes("Unsupported") ||
						error.message.includes("too large")
					) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Get an image by ID (public)
	 * Returns null if image not found
	 */
	getById: publicProcedure
		.input(getImageSchema)
		.query(async ({ ctx, input }) => {
			return await ctx.services.images.getImage(input.imageId);
		}),

	/**
	 * Delete an image and all its variants from S3 and database.
	 * Uses images domains service for deletion logic.
	 */
	delete: protectedProcedure
		.input(deleteImageSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.images.deleteImage(input);
			} catch (error) {
				if (
					error instanceof Error &&
					error.message.includes("not found or access denied")
				) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Image not found or access denied",
					});
				}
				throw error;
			}
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

			// Note: createRecord keeps direct DB access as it's just metadata insertion
			// The upload flow handles the full pipeline via domains service
			const [record] = await ctx.db
				.insert(images)
				.values({
					merchantId: ctx.session.merchantId,
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

export type ImageRouter = typeof imageRouter;
