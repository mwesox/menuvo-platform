/**
 * Images Domain Types
 *
 * Domain types for image operations.
 */

import type {
	CreateImageRecordInput as CreateImageRecordInputSchema,
	DeleteImageInput as DeleteImageInputSchema,
	ImageType,
} from "./schemas.js";

/**
 * Storage service interface for S3 operations
 */
export interface StorageService {
	deleteImageVariants(key: string): Promise<{
		deleted: string[];
		failed: string[];
		notFound: string[];
	}>;
}

/**
 * Input for uploading an image
 */
export interface UploadImageInput {
	buffer: Uint8Array;
	merchantId: string;
	type: ImageType;
	filename: string;
	mimeType: string;
}

/**
 * Input for deleting an image
 */
export type DeleteImageInput = DeleteImageInputSchema;

/**
 * Result of image deletion
 */
export interface DeleteImageResult {
	success: boolean;
	s3Result: {
		deleted: string[];
		failed: string[];
		notFound: string[];
	} | null;
}

/**
 * Input for creating an image record
 */
export type CreateImageRecordInput = CreateImageRecordInputSchema;
