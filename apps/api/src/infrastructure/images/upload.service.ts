/**
 * Image Upload Service
 *
 * Handles the full image upload pipeline:
 * 1. Validate file size
 * 2. Process with Sharp (WebP + thumbnail)
 * 3. Generate storage keys
 * 4. Upload to S3
 * 5. Insert database record
 */

import type { db as DbType } from "@menuvo/db";
import type { Image } from "@menuvo/db/schema";
import { images } from "@menuvo/db/schema";
import type { ImageType } from "../../domains/images/schemas.js";
import { getUrl, uploadFile } from "../storage/s3-client.js";
import {
	isValidImageMime,
	MAX_FILE_SIZE,
	processToVariants,
} from "./processing.js";
import { generateStorageKeys, getExtensionFromMime } from "./storage-keys.js";

// ============================================================================
// Types
// ============================================================================

export interface UploadImageInput {
	buffer: Uint8Array;
	merchantId: string;
	type: ImageType;
	filename: string;
	mimeType: string;
}

export class ImageUploadError extends Error {
	public readonly code: string;

	constructor(message: string, code: string) {
		super(message);
		this.code = code;
		this.name = "ImageUploadError";
	}
}

// ============================================================================
// Service
// ============================================================================

/**
 * Upload an image: validate, process, store to S3, persist to database.
 *
 * Follows the pattern: validate → process → store → persist.
 */
export async function uploadImage(
	input: UploadImageInput,
	db: typeof DbType,
): Promise<Image> {
	// 1. Validate MIME type
	if (!isValidImageMime(input.mimeType)) {
		throw new ImageUploadError(
			`Unsupported image type: ${input.mimeType}`,
			"INVALID_MIME_TYPE",
		);
	}

	// 2. Validate file size
	if (input.buffer.length > MAX_FILE_SIZE) {
		throw new ImageUploadError(
			`Image too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
			"FILE_TOO_LARGE",
		);
	}

	// 3. Process image (WebP conversion + thumbnail generation)
	const variants = await processToVariants(input.buffer);

	// 4. Generate storage keys
	const extension = getExtensionFromMime(input.mimeType);
	const keys = generateStorageKeys(input.merchantId, input.type, extension);

	// 5. Upload all variants to S3 in parallel
	await Promise.all([
		uploadFile(keys.original, input.buffer, { type: input.mimeType }),
		uploadFile(keys.webp, variants.webpBuffer, { type: "image/webp" }),
		uploadFile(keys.thumbnail, variants.thumbnailBuffer, {
			type: "image/webp",
		}),
	]);

	// 6. Insert to database
	const [record] = await db
		.insert(images)
		.values({
			merchantId: input.merchantId,
			type: input.type,
			key: keys.webp,
			originalUrl: getUrl(keys.webp),
			thumbnailUrl: getUrl(keys.thumbnail),
			filename: `${input.filename}.webp`,
			mimeType: "image/webp",
			sizeBytes: variants.webpBuffer.length,
			width: variants.width,
			height: variants.height,
		})
		.returning();

	if (!record) {
		throw new Error("Failed to create image record");
	}

	return record;
}
