import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db";
import { images } from "@menuvo/db/schema";
import { imageLogger } from "@/lib/logger";
import {
	deleteFile,
	getFileBuffer,
	getPublicUrl,
	uploadFile,
} from "@/lib/storage/s3-client";
import {
	DISPLAY_SIZE,
	THUMBNAIL_QUALITY,
	THUMBNAIL_SIZE,
	WEBP_QUALITY,
} from "../constants";

/**
 * Result of processing an image to variants.
 */
export interface ProcessedImageVariants {
	webpBuffer: Buffer;
	thumbnailBuffer: Buffer;
	width: number;
	height: number;
}

/**
 * Process an uploaded image buffer and generate WebP + thumbnail variants.
 * Pure function: buffer in → variants out.
 */
export async function processToVariants(
	inputBuffer: Uint8Array,
): Promise<ProcessedImageVariants> {
	const buffer = Buffer.from(inputBuffer);
	const image = sharp(buffer);
	const metadata = await image.metadata();

	// Convert to WebP
	const webpBuffer = await image.webp({ quality: WEBP_QUALITY }).toBuffer();

	// Generate thumbnail (square crop)
	const thumbnailBuffer = await sharp(buffer)
		.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: "cover" })
		.webp({ quality: THUMBNAIL_QUALITY })
		.toBuffer();

	return {
		webpBuffer,
		thumbnailBuffer,
		width: metadata.width ?? 0,
		height: metadata.height ?? 0,
	};
}

/**
 * Process an uploaded image and convert it to WebP format.
 * Returns the WebP buffer along with dimensions.
 */
export async function processToWebp(
	inputBuffer: Buffer,
): Promise<{ buffer: Buffer; width: number; height: number }> {
	const image = sharp(inputBuffer);
	const metadata = await image.metadata();

	const buffer = await image.webp({ quality: WEBP_QUALITY }).toBuffer();

	return {
		buffer,
		width: metadata.width ?? 0,
		height: metadata.height ?? 0,
	};
}

/**
 * Generate thumbnail and display variants for an uploaded image.
 * This is called asynchronously by the worker after upload.
 */
export async function processImageVariants(imageId: string): Promise<void> {
	// Fetch the image record
	const record = await db.query.images.findFirst({
		where: eq(images.id, imageId),
	});

	if (!record) {
		imageLogger.error({ imageId }, "Image not found for variant processing");
		return;
	}

	// Download the original image from S3
	const originalBuffer = await getFileBuffer(record.key);

	// Generate thumbnail (200x200, cover crop for square)
	const thumbnailBuffer = await sharp(originalBuffer)
		.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: "cover" })
		.webp({ quality: THUMBNAIL_QUALITY })
		.toBuffer();

	const thumbnailKey = record.key.replace(".webp", "_thumb.webp");
	await uploadFile(thumbnailKey, thumbnailBuffer, { type: "image/webp" });

	// Generate display variant (800px max, maintain aspect ratio)
	const displayBuffer = await sharp(originalBuffer)
		.resize(DISPLAY_SIZE, DISPLAY_SIZE, { fit: "inside" })
		.webp({ quality: WEBP_QUALITY })
		.toBuffer();

	const displayKey = record.key.replace(".webp", "_display.webp");
	await uploadFile(displayKey, displayBuffer, { type: "image/webp" });

	// Update the database record with variant URLs
	await db
		.update(images)
		.set({
			thumbnailUrl: getPublicUrl(thumbnailKey),
			displayUrl: getPublicUrl(displayKey),
		})
		.where(eq(images.id, imageId));

	imageLogger.info({ imageId }, "Generated variants for image");
}

/**
 * Delete an image and all its variants from S3.
 */
export async function deleteImageVariants(key: string): Promise<void> {
	const variants = [
		key,
		key.replace(".webp", "_thumb.webp"),
		key.replace(".webp", "_display.webp"),
	];

	await Promise.allSettled(
		variants.map((k) =>
			deleteFile(k).catch((err) => {
				imageLogger.warn(
					{ key: k, error: err },
					"Failed to delete image variant",
				);
			}),
		),
	);
}
