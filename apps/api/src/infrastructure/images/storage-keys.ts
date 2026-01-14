/**
 * Storage Key Generation
 *
 * Generates S3 storage keys for image variants.
 */

import type { ImageType } from "../../domains/images/schemas.js";

// ============================================================================
// Types
// ============================================================================

/**
 * S3 storage keys for image variants.
 */
export interface StorageKeys {
	/** Key for original file (backup) */
	original: string;
	/** Key for WebP converted file */
	webp: string;
	/** Key for thumbnail file */
	thumbnail: string;
}

// ============================================================================
// MIME to Extension Mapping
// ============================================================================

const MIME_TO_EXTENSION: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/png": "png",
	"image/gif": "gif",
	"image/webp": "webp",
	"image/heic": "heic",
	"image/heif": "heif",
};

// ============================================================================
// Functions
// ============================================================================

/**
 * Generate S3 storage keys for image upload.
 * Pure function: deterministic key generation.
 *
 * @param merchantId - Merchant UUID
 * @param type - Image type (item_image, store_logo, etc.)
 * @param extension - Original file extension
 * @param uuid - Optional UUID (generated if not provided)
 */
export function generateStorageKeys(
	merchantId: string,
	type: ImageType,
	extension: string,
	uuid?: string,
): StorageKeys {
	const id = uuid ?? crypto.randomUUID();
	const basePath = `${merchantId}/${type}/${id}`;

	return {
		original: `${basePath}_original.${extension}`,
		webp: `${basePath}.webp`,
		thumbnail: `${basePath}_thumb.webp`,
	};
}

/**
 * Get file extension from MIME type.
 *
 * @param mimeType - MIME type string
 * @returns File extension (without dot), defaults to "jpg"
 */
export function getExtensionFromMime(mimeType: string): string {
	return MIME_TO_EXTENSION[mimeType] ?? "jpg";
}
