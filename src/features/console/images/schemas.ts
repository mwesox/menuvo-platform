import { z } from "zod";
import { imageType } from "@/db/schema";
import { SUPPORTED_MIME_TYPES } from "./constants";

/**
 * Schema for uploading an image (server schema with real types).
 * Note: mimeType is validated at runtime via refine, but typed as string for flexibility.
 */
export const uploadImageSchema = z.object({
	buffer: z.instanceof(Uint8Array),
	merchantId: z.string().uuid(),
	type: z.enum(imageType),
	filename: z.string().min(1).default("image"),
	mimeType: z
		.string()
		.refine(
			(mime) =>
				SUPPORTED_MIME_TYPES.includes(
					mime as (typeof SUPPORTED_MIME_TYPES)[number],
				),
			{ message: "Unsupported image type" },
		),
});

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
export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type DeleteImageInput = z.infer<typeof deleteImageSchema>;
export type GetImageInput = z.infer<typeof getImageSchema>;
