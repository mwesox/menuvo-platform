/**
 * Image upload constants.
 */

import { z } from "zod/v4";

/** Maximum file size in bytes (4MB) */
export const MAX_FILE_SIZE = 4 * 1024 * 1024;

/** Thumbnail dimension in pixels (square) */
export const THUMBNAIL_SIZE = 200;

/** Display image max dimension in pixels */
export const DISPLAY_SIZE = 800;

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

export const imageTypes = [
	"item_image",
	"store_logo",
	"store_banner",
	"merchant_logo",
] as const;

export const imageTypeSchema = z.enum(imageTypes);
export type ImageType = z.infer<typeof imageTypeSchema>;
