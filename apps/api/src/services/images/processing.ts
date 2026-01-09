/**
 * Image Processing Utilities
 *
 * Handles image conversion and variant generation using Sharp.
 */

import sharp from "sharp";

// ============================================================================
// Constants
// ============================================================================

/** Maximum file size in bytes (4MB) */
export const MAX_FILE_SIZE = 4 * 1024 * 1024;

/** Thumbnail dimension in pixels (square) */
export const THUMBNAIL_SIZE = 200;

/** WebP conversion quality (0-100) */
export const WEBP_QUALITY = 85;

/** Thumbnail WebP quality (0-100) */
export const THUMBNAIL_QUALITY = 80;

/** Supported MIME types for image upload */
export const SUPPORTED_MIME_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/heic",
	"image/heif",
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

// ============================================================================
// Types
// ============================================================================

/**
 * Result of processing an image to variants.
 */
export interface ProcessedImageVariants {
	webpBuffer: Buffer;
	thumbnailBuffer: Buffer;
	width: number;
	height: number;
}

// ============================================================================
// Functions
// ============================================================================

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
 * Check if a MIME type is valid for image upload.
 */
export function isValidImageMime(mimeType: string): boolean {
	return SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType);
}
