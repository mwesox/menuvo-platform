import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db";
import { images } from "@/db/schema";
import { imageLogger } from "@/lib/logger";
import {
	deleteFile,
	getFileBuffer,
	getPublicUrl,
	uploadFile,
} from "./s3-client";

// Image variant sizes
const THUMBNAIL_SIZE = 200; // Square thumbnail for lists
const DISPLAY_SIZE = 800; // Main display size for detail views

/**
 * Process an uploaded image and convert it to WebP format.
 * Returns the WebP buffer along with dimensions.
 */
export async function processToWebp(
	inputBuffer: Buffer,
): Promise<{ buffer: Buffer; width: number; height: number }> {
	const image = sharp(inputBuffer);
	const metadata = await image.metadata();

	const buffer = await image.webp({ quality: 85 }).toBuffer();

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
		.webp({ quality: 80 })
		.toBuffer();

	const thumbnailKey = record.key.replace(".webp", "_thumb.webp");
	await uploadFile(thumbnailKey, thumbnailBuffer, { type: "image/webp" });

	// Generate display variant (800px max, maintain aspect ratio)
	const displayBuffer = await sharp(originalBuffer)
		.resize(DISPLAY_SIZE, DISPLAY_SIZE, { fit: "inside" })
		.webp({ quality: 85 })
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
