/**
 * Image Upload API Route
 *
 * Accepts FormData with binary image data.
 * Processes synchronously: converts to WebP + generates thumbnail.
 * Stores 3 files to S3: original (backup), webp (display), thumbnail.
 *
 * FormData fields:
 * - file: File (binary image data)
 * - merchantId: string (UUID)
 * - type: ImageType
 * - filename: string (optional)
 */
import { createFileRoute } from "@tanstack/react-router";
// NOTE: Server-only imports (sharp, db, s3) are dynamically imported inside handler
// to prevent bundling in client via routeTree.gen.ts
import { type ImageType, imageType } from "@/db/schema";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB safety limit

export const Route = createFileRoute("/api/images/upload")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				// Dynamic imports to prevent client bundling
				const [
					{ default: sharp },
					{ db },
					{ images },
					{ imageLogger },
					{ getPublicUrl, uploadFile },
				] = await Promise.all([
					import("sharp"),
					import("@/db"),
					import("@/db/schema"),
					import("@/lib/logger"),
					import("@/lib/storage/s3-client"),
				]);

				const formData = await request.formData();

				const file = formData.get("file") as File | null;
				const merchantIdStr = formData.get("merchantId") as string | null;
				const type = formData.get("type") as string | null;
				const filename = (formData.get("filename") as string) || "image";

				// Validate required fields
				if (!file) {
					return Response.json({ error: "Missing file" }, { status: 400 });
				}

				if (!merchantIdStr) {
					return Response.json(
						{ error: "Missing merchantId" },
						{ status: 400 },
					);
				}

				const merchantId = merchantIdStr;

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
					// Get binary data (use Uint8Array instead of Node.js Buffer for broader compatibility)
					const arrayBuffer = await file.arrayBuffer();
					const buffer = new Uint8Array(arrayBuffer);

					// Validate size (safety net - client should resize first)
					if (buffer.length > MAX_FILE_SIZE) {
						return Response.json(
							{ error: "Image too large (max 4MB)" },
							{ status: 400 },
						);
					}

					// Determine original file extension
					const mimeType = file.type || "image/jpeg";
					const ext = getExtensionFromMime(mimeType);

					// Process image in memory
					const sharpImage = sharp(buffer);
					const metadata = await sharpImage.metadata();

					// Convert to WebP
					const webpBuffer = await sharpImage.webp({ quality: 85 }).toBuffer();

					// Generate thumbnail (200x200 cover crop)
					const thumbBuffer = await sharp(buffer)
						.resize(200, 200, { fit: "cover" })
						.webp({ quality: 80 })
						.toBuffer();

					// Generate S3 keys
					const uuid = crypto.randomUUID();
					const originalKey = `${merchantId}/${type}/${uuid}_original.${ext}`;
					const webpKey = `${merchantId}/${type}/${uuid}.webp`;
					const thumbKey = `${merchantId}/${type}/${uuid}_thumb.webp`;

					// Upload all 3 files to S3 in parallel
					await Promise.all([
						uploadFile(originalKey, buffer, { type: mimeType }),
						uploadFile(webpKey, webpBuffer, { type: "image/webp" }),
						uploadFile(thumbKey, thumbBuffer, { type: "image/webp" }),
					]);

					// Create database record with final URLs
					const [record] = await db
						.insert(images)
						.values({
							merchantId,
							type: type as ImageType,
							key: webpKey,
							originalUrl: getPublicUrl(webpKey),
							thumbnailUrl: getPublicUrl(thumbKey),
							filename: `${filename}.webp`,
							mimeType: "image/webp",
							sizeBytes: webpBuffer.length,
							width: metadata.width ?? 0,
							height: metadata.height ?? 0,
						})
						.returning();

					imageLogger.debug(
						{ imageId: record.id, merchantId },
						"Image uploaded and processed",
					);

					return Response.json(record);
				} catch (error) {
					imageLogger.error({ error }, "Image upload failed");
					return Response.json(
						{ error: error instanceof Error ? error.message : "Upload failed" },
						{ status: 500 },
					);
				}
			},
		},
	},
});

/**
 * Get file extension from MIME type.
 */
function getExtensionFromMime(mimeType: string): string {
	const mimeMap: Record<string, string> = {
		"image/jpeg": "jpg",
		"image/jpg": "jpg",
		"image/png": "png",
		"image/gif": "gif",
		"image/webp": "webp",
		"image/heic": "heic",
		"image/heif": "heif",
	};
	return mimeMap[mimeType] || "jpg";
}
