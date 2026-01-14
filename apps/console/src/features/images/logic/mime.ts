import { SUPPORTED_MIME_TYPES } from "../constants.ts";

/**
 * MIME type to file extension mapping.
 */
const MIME_TO_EXTENSION: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/png": "png",
	"image/gif": "gif",
	"image/webp": "webp",
	"image/heic": "heic",
	"image/heif": "heif",
};

/**
 * Get file extension from MIME type.
 * Pure function.
 *
 * @param mimeType - MIME type string
 * @returns File extension (without dot), defaults to "jpg"
 */
export function getExtensionFromMime(mimeType: string): string {
	return MIME_TO_EXTENSION[mimeType] ?? "jpg";
}

/**
 * Check if a MIME type is valid for image upload.
 * Pure function.
 *
 * @param mimeType - MIME type string to validate
 * @returns true if the MIME type is supported
 */
export function isValidImageMime(mimeType: string): boolean {
	return SUPPORTED_MIME_TYPES.includes(
		mimeType as (typeof SUPPORTED_MIME_TYPES)[number],
	);
}
