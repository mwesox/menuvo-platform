import { db } from "@/db";
import { type ImageType, images, imageType } from "@/db/schema";
import { imageLogger } from "@/lib/logger";
import { enqueueVariantJob } from "@/lib/queue/image-queue";
import { processToWebp } from "@/lib/storage/image-processor";
import { uploadFile } from "@/lib/storage/s3-client";

/**
 * Handle image upload requests.
 *
 * Accepts FormData with binary image data (no base64 encoding).
 * This provides ~33% smaller network payload compared to base64.
 *
 * FormData fields:
 * - file: File (binary image data)
 * - merchantId: string (will be parsed as number)
 * - type: ImageType ("item_image" | "store_logo" | etc.)
 * - filename: string (optional)
 */
export async function handleImageUpload(req: Request): Promise<Response> {
	// Parse FormData (binary) - no JSON, no base64!
	const formData = await req.formData();

	const file = formData.get("file") as File | null;
	const merchantIdStr = formData.get("merchantId") as string | null;
	const type = formData.get("type") as string | null;
	const filename = (formData.get("filename") as string) || "image.webp";

	// Validate required fields
	if (!file) {
		return Response.json({ error: "Missing file" }, { status: 400 });
	}

	if (!merchantIdStr) {
		return Response.json({ error: "Missing merchantId" }, { status: 400 });
	}

	const merchantId = Number(merchantIdStr);
	if (Number.isNaN(merchantId) || merchantId <= 0) {
		return Response.json({ error: "Invalid merchantId" }, { status: 400 });
	}

	if (!type) {
		return Response.json({ error: "Missing type" }, { status: 400 });
	}

	if (!imageType.includes(type as ImageType)) {
		return Response.json(
			{
				error: `Invalid image type. Must be one of: ${imageType.join(", ")}`,
			},
			{ status: 400 },
		);
	}

	try {
		// Get binary data directly - NO base64 decode needed!
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Process to WebP using Sharp
		const { buffer: webpBuffer, width, height } = await processToWebp(buffer);

		// Generate unique key and upload to S3
		const uuid = crypto.randomUUID();
		const key = `${merchantId}/${type}/${uuid}.webp`;
		const originalUrl = await uploadFile(key, webpBuffer, {
			type: "image/webp",
		});

		// Create database record
		const [record] = await db
			.insert(images)
			.values({
				merchantId,
				type: type as ImageType,
				key,
				originalUrl,
				filename,
				mimeType: "image/webp",
				sizeBytes: webpBuffer.length,
				width,
				height,
			})
			.returning();

		// Queue variant generation (async)
		await enqueueVariantJob(record.id);

		return Response.json(record);
	} catch (error) {
		imageLogger.error({ error }, "Image upload failed");
		return Response.json(
			{ error: error instanceof Error ? error.message : "Upload failed" },
			{ status: 500 },
		);
	}
}
