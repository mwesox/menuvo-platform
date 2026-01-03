import { z } from "zod";

/**
 * Schema for deleting an image.
 */
export const deleteImageSchema = z.object({
	imageId: z.number().int().positive(),
	merchantId: z.number().int().positive(),
});

/**
 * Schema for getting an image by ID.
 */
export const getImageSchema = z.object({
	imageId: z.number().int().positive(),
});

// Type exports
export type DeleteImageInput = z.infer<typeof deleteImageSchema>;
export type GetImageInput = z.infer<typeof getImageSchema>;
