/**
 * S3 Storage Service
 *
 * Higher-level operations for S3 storage, including image variant management.
 * Uses the low-level s3-client for actual S3 operations.
 */

import { deleteFile, fileExists } from "./s3-client.js";

/**
 * Logger for S3 operations
 */
const log = {
	info: (msg: string, data?: Record<string, unknown>) =>
		console.log(`[s3.service] ${msg}`, data ? JSON.stringify(data) : ""),
	warn: (msg: string, data?: Record<string, unknown>) =>
		console.warn(`[s3.service] ${msg}`, data ? JSON.stringify(data) : ""),
	error: (msg: string, data?: Record<string, unknown>) =>
		console.error(`[s3.service] ${msg}`, data ? JSON.stringify(data) : ""),
};

/**
 * Get all variant keys for an image.
 * Images are stored as:
 * - {key}.webp (original)
 * - {key}_thumb.webp (thumbnail)
 * - {key}_display.webp (display size)
 */
export function getImageVariantKeys(key: string): string[] {
	// Handle both .webp and non-.webp keys
	const baseKey = key.replace(/\.webp$/, "");

	return [
		`${baseKey}.webp`,
		`${baseKey}_thumb.webp`,
		`${baseKey}_display.webp`,
	];
}

/**
 * Delete an image and all its variants from S3.
 * Gracefully handles missing files (already deleted or never created).
 *
 * @param key - The S3 key for the original image (e.g., "{merchantId}/item_image/{uuid}.webp")
 * @returns Object with results for each variant
 */
export async function deleteImageVariants(
	key: string,
): Promise<{ deleted: string[]; failed: string[]; notFound: string[] }> {
	const variantKeys = getImageVariantKeys(key);
	const results = {
		deleted: [] as string[],
		failed: [] as string[],
		notFound: [] as string[],
	};

	await Promise.allSettled(
		variantKeys.map(async (variantKey) => {
			try {
				// Check if file exists first to avoid unnecessary delete calls
				const exists = await fileExists(variantKey);
				if (!exists) {
					results.notFound.push(variantKey);
					return;
				}

				await deleteFile(variantKey);
				results.deleted.push(variantKey);
			} catch (error) {
				log.warn("Failed to delete image variant", {
					key: variantKey,
					error: error instanceof Error ? error.message : String(error),
				});
				results.failed.push(variantKey);
			}
		}),
	);

	if (results.deleted.length > 0) {
		log.info("Deleted image variants", {
			key,
			deleted: results.deleted,
			notFound: results.notFound,
		});
	}

	return results;
}

/**
 * Storage service interface for dependency injection.
 * This allows the tRPC context to remain decoupled from S3 implementation.
 */
export interface StorageService {
	deleteImageVariants: typeof deleteImageVariants;
}

/**
 * Create a storage service instance.
 * Use this in the API context creation.
 */
export function createStorageService(): StorageService {
	return {
		deleteImageVariants,
	};
}
