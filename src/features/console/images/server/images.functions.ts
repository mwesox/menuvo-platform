"use server";

import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { images } from "@/db/schema";
import { deleteImageVariants } from "@/lib/storage/image-processor";
import { deleteImageSchema, getImageSchema } from "../schemas";

/**
 * Delete an image and all its variants.
 * Verifies ownership before deletion.
 */
export const deleteImage = createServerFn({ method: "POST" })
	.inputValidator(deleteImageSchema)
	.handler(async ({ data }) => {
		// Fetch record and verify ownership
		const record = await db.query.images.findFirst({
			where: and(
				eq(images.id, data.imageId),
				eq(images.merchantId, data.merchantId),
			),
		});

		if (!record) {
			throw new Error("Image not found or access denied");
		}

		// Delete all variants from S3
		await deleteImageVariants(record.key);

		// Delete database record
		await db.delete(images).where(eq(images.id, data.imageId));

		return { success: true };
	});

/**
 * Get an image by ID.
 */
export const getImage = createServerFn({ method: "GET" })
	.inputValidator(getImageSchema)
	.handler(async ({ data }) => {
		const record = await db.query.images.findFirst({
			where: eq(images.id, data.imageId),
		});
		return record ?? null;
	});
