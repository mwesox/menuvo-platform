import { z } from "zod";

/**
 * Schema for deleting an image.
 */
export const deleteImageSchema = z.object({
	imageId: z.string().uuid(),
	merchantId: z.string().uuid(),
});

/**
 * Schema for getting an image by ID.
 */
export const getImageSchema = z.object({
	imageId: z.string().uuid(),
});

// Type exports
export type DeleteImageInput = z.infer<typeof deleteImageSchema>;
export type GetImageInput = z.infer<typeof getImageSchema>;
