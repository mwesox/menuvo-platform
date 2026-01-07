/**
 * Image Upload API Route
 *
 * Thin wiring: parse FormData → delegate to server function → respond.
 *
 * FormData fields:
 * - file: File (binary image data)
 * - merchantId: string (UUID)
 * - type: ImageType
 * - filename: string (optional)
 */
import { createFileRoute } from "@tanstack/react-router";
import { type ImageType, imageType } from "@/db/schema";

export const Route = createFileRoute("/api/images/upload")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				// Parse FormData (transport concern)
				const formData = await request.formData();
				const input = parseFormData(formData);

				// Validate required fields (early return for missing data)
				if (!input.file) {
					return Response.json({ error: "Missing file" }, { status: 400 });
				}
				if (!input.merchantId) {
					return Response.json(
						{ error: "Missing merchantId" },
						{ status: 400 },
					);
				}
				if (!input.type) {
					return Response.json({ error: "Missing type" }, { status: 400 });
				}
				if (!imageType.includes(input.type as ImageType)) {
					return Response.json(
						{
							error: `Invalid image type. Must be one of: ${imageType.join(", ")}`,
						},
						{ status: 400 },
					);
				}

				try {
					// Get binary data
					const arrayBuffer = await input.file.arrayBuffer();
					const buffer = new Uint8Array(arrayBuffer);

					// Dynamic import to prevent client bundling
					const { uploadImage } = await import(
						"@/features/console/images/server/upload.functions"
					);

					// Delegate to server function
					const mimeType = input.file.type || "image/jpeg";
					const result = await uploadImage({
						buffer,
						merchantId: input.merchantId,
						type: input.type as ImageType,
						filename: input.filename,
						mimeType,
					});

					return Response.json(result);
				} catch (error) {
					return handleUploadError(error);
				}
			},
		},
	},
});

/**
 * Parse FormData into typed input object.
 */
function parseFormData(formData: FormData) {
	return {
		file: formData.get("file") as File | null,
		merchantId: formData.get("merchantId") as string | null,
		type: formData.get("type") as string | null,
		filename: (formData.get("filename") as string) || "image",
	};
}

/**
 * Map errors to HTTP responses.
 */
async function handleUploadError(error: unknown): Promise<Response> {
	// Dynamic import to prevent client bundling
	const { imageLogger } = await import("@/lib/logger");

	// Serialize error properly for logging
	const errorInfo =
		error instanceof Error
			? { message: error.message, stack: error.stack, name: error.name }
			: { raw: String(error) };

	imageLogger.error({ err: errorInfo }, "Image upload failed");

	// Check for known error types
	if (error instanceof Error && error.name === "ImageUploadError") {
		return Response.json({ error: error.message }, { status: 400 });
	}

	return Response.json(
		{ error: error instanceof Error ? error.message : "Upload failed" },
		{ status: 500 },
	);
}
