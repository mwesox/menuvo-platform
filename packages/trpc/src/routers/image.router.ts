/**
 * Image Router
 *
 * Handles image-related procedures:
 * - Image upload (FormData)
 * - Image retrieval
 * - Image deletion (including S3 cleanup via injected storage service)
 * - Image record creation
 */

import type { ImageType } from "@menuvo/db/schema";
import { images, imageType } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { S3Client } from "bun";
import { and, eq } from "drizzle-orm";
import sharp from "sharp";
import { z } from "zod";
import {
	createImageRecordSchema,
	deleteImageSchema,
	getImageSchema,
} from "../schemas/index.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

// ============================================================================
// S3 Client
// ============================================================================

const s3 = new S3Client({
	endpoint: process.env.S3_ENDPOINT!,
	accessKeyId: process.env.S3_ACCESS_KEY_ID!,
	secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
	bucket: process.env.S3_BUCKET!,
	region: process.env.S3_REGION ?? "auto",
});

const getUrl = (key: string) => `${process.env.S3_BASE_URL}/${key}`;

// ============================================================================
// Router
// ============================================================================

export const imageRouter = router({
	/**
	 * Upload an image via FormData
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
			if (!merchantId || merchantId !== ctx.session.merchantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Invalid merchantId",
				});
			}
			if (!type || !imageType.includes(type as ImageType)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid image type",
				});
			}

			const buffer = Buffer.from(await file.arrayBuffer());

			// Process image
			const image = sharp(buffer);
			const metadata = await image.metadata();
			const webpBuffer = await image.webp({ quality: 85 }).toBuffer();
			const thumbnailBuffer = await sharp(buffer)
				.resize(200, 200, { fit: "cover" })
				.webp({ quality: 80 })
				.toBuffer();

			// Generate keys
			const id = crypto.randomUUID();
			const basePath = `${merchantId}/${type}/${id}`;
			const keys = {
				webp: `${basePath}.webp`,
				thumbnail: `${basePath}_thumb.webp`,
			};

			// Upload to S3
			await Promise.all([
				s3.write(keys.webp, webpBuffer, { type: "image/webp" }),
				s3.write(keys.thumbnail, thumbnailBuffer, { type: "image/webp" }),
			]);

			// Insert to database
			const [record] = await ctx.db
				.insert(images)
				.values({
					merchantId,
					type: type as ImageType,
					key: keys.webp,
					originalUrl: getUrl(keys.webp),
					thumbnailUrl: getUrl(keys.thumbnail),
					filename: `${filename}.webp`,
					mimeType: "image/webp",
					sizeBytes: webpBuffer.length,
					width: metadata.width ?? 0,
					height: metadata.height ?? 0,
				})
				.returning();

			return record;
		}),

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
