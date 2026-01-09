/**
 * Image Services
 *
 * Exports all image-related services and utilities.
 */

export {
	isValidImageMime,
	MAX_FILE_SIZE,
	type ProcessedImageVariants,
	processToVariants,
	SUPPORTED_MIME_TYPES,
	type SupportedMimeType,
	THUMBNAIL_QUALITY,
	THUMBNAIL_SIZE,
	WEBP_QUALITY,
} from "./processing.js";
export {
	generateStorageKeys,
	getExtensionFromMime,
	type StorageKeys,
} from "./storage-keys.js";
export {
	ImageUploadError,
	type UploadImageInput,
	uploadImage,
} from "./upload.service.js";
