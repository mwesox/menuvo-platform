import { db } from "@/db";
import type { Image } from "@/db/schema";
import { images } from "@/db/schema";
import { imageLogger } from "@/lib/logger";
import { getPublicUrl, uploadFile } from "@/lib/storage/s3-client";
import { MAX_FILE_SIZE } from "../constants";
import { processToVariants } from "../logic/image-processing";
import { getExtensionFromMime } from "../logic/mime";
import { generateStorageKeys } from "../logic/storage-keys";
import { type UploadImageInput, uploadImageSchema } from "../schemas";

/**
 * Custom error for image upload validation failures.
 */
export class ImageUploadError extends Error {
	constructor(
		message: string,
		public code: string,
	) {
		super(message);
		this.name = "ImageUploadError";
	}
}

/**
 * Upload an image: validate, process, store to S3, persist to database.
 *
 * This is the server function that handles the full upload flow.
 * Follows the pattern: validate → process → store → persist.
 */
export async function uploadImage(input: UploadImageInput): Promise<Image> {
	// 1. Validate with schema
	const validated = uploadImageSchema.parse(input);

	// 2. Validate file size
	if (validated.buffer.length > MAX_FILE_SIZE) {
		throw new ImageUploadError(
			`Image too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
			"FILE_TOO_LARGE",
		);
	}

	// 3. Process image (WebP conversion + thumbnail generation)
	const variants = await processToVariants(validated.buffer);

	// 4. Generate storage keys
	const extension = getExtensionFromMime(validated.mimeType);
	const keys = generateStorageKeys(
		validated.merchantId,
		validated.type,
		extension,
	);

	// 5. Upload all variants to S3 in parallel
	await Promise.all([
		uploadFile(keys.original, validated.buffer, { type: validated.mimeType }),
		uploadFile(keys.webp, variants.webpBuffer, { type: "image/webp" }),
		uploadFile(keys.thumbnail, variants.thumbnailBuffer, {
			type: "image/webp",
		}),
	]);

	// 6. Insert to database directly (no repository pattern)
	const [record] = await db
		.insert(images)
		.values({
			merchantId: validated.merchantId,
			type: validated.type,
			key: keys.webp,
			originalUrl: getPublicUrl(keys.webp),
			thumbnailUrl: getPublicUrl(keys.thumbnail),
			filename: `${validated.filename}.webp`,
			mimeType: "image/webp",
			sizeBytes: variants.webpBuffer.length,
			width: variants.width,
			height: variants.height,
		})
		.returning();

	imageLogger.debug(
		{ imageId: record.id, merchantId: validated.merchantId },
		"Image uploaded and processed",
	);

	return record;
}
