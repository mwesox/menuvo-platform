import type { ImageType } from "@/db/schema";

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
