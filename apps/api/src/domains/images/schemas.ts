/**
 * Images Schemas
 *
 * Zod schemas for image-related API inputs.
 */

import { z } from "zod";

export const imageType = [
	"item_image",
	"store_logo",
	"store_banner",
	"merchant_logo",
] as const;

/**
 * Image type enum derived from database schema
 */
export const imageTypeSchema = z.enum(imageType);

export type ImageType = z.infer<typeof imageTypeSchema>;

/**
 * Get image by ID - API schema
 */
export const getImageSchema = z.object({
	imageId: z.string().uuid(),
});

/**
 * Delete image - API schema
 */
export const deleteImageSchema = z.object({
	imageId: z.string().uuid(),
	merchantId: z.string().uuid(),
});

/**
 * Create image record - API schema
 * Used after file upload to S3 is complete
 */
export const createImageRecordSchema = z.object({
	merchantId: z.string().uuid(),
	type: imageTypeSchema,
	key: z.string().min(1),
	originalUrl: z.string().url(),
	thumbnailUrl: z.string().url().optional(),
	filename: z.string().min(1),
	mimeType: z.string().min(1),
	sizeBytes: z.number().int().positive(),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
});

export type GetImageInput = z.infer<typeof getImageSchema>;
export type DeleteImageInput = z.infer<typeof deleteImageSchema>;
export type CreateImageRecordInput = z.infer<typeof createImageRecordSchema>;
