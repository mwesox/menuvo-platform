import { imageLogger } from "@/lib/logger";

/**
 * Processed image variants result type.
 */
export interface ProcessedImageVariants {
	webpBuffer: Uint8Array;
	thumbnailBuffer: Uint8Array;
	width: number;
	height: number;
}

/**
 * Pure function: buffer in → variants out.
 * TODO: Move to API side
 */
export async function processToVariants(
	_inputBuffer: Uint8Array,
): Promise<ProcessedImageVariants> {
	// TODO: Implement image processing on API side
	imageLogger.info("Image processing not implemented in console app");
	throw new Error("Not implemented");
}

/**
 * Process an uploaded image and convert it to WebP format.
 * TODO: Move to API side
 */
export async function processImageToWebp(
	_inputBuffer: Uint8Array,
): Promise<{ buffer: Uint8Array; width: number; height: number }> {
	// TODO: Implement image processing on API side
	imageLogger.info("Image processing not implemented in console app");
	throw new Error("Not implemented");
}

/**
 * Generate thumbnail and display variants for an uploaded image.
 * TODO: Move to API side
 */
export async function processImageVariants(imageId: string): Promise<void> {
	// TODO: Implement via tRPC call to API
	imageLogger.info(
		{ imageId },
		"Image variant processing not implemented in console app",
	);
}

/**
 * Delete an image and all its variants from S3.
 * TODO: Move to API side
 */
export async function deleteImageVariants(key: string): Promise<void> {
	// TODO: Implement via tRPC call to API
	imageLogger.info({ key }, "Image deletion not implemented in console app");
}
