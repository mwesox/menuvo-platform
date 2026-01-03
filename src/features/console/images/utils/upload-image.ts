import type { Image, ImageType } from "@/db/schema.ts";

// Worker URL for direct communication (bypasses Vite proxy FormData issues)
// Set VITE_WORKER_URL=http://localhost:3001 in dev, leave unset in prod
const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? "";

/**
 * Upload an image using binary FormData (no base64 encoding).
 *
 * This provides ~33% smaller network payload compared to base64.
 * The browser automatically sets Content-Type: multipart/form-data.
 */
export async function uploadImageBinary(
	blob: Blob,
	merchantId: number,
	type: ImageType,
	filename?: string,
): Promise<Image> {
	const formData = new FormData();
	formData.append("file", blob, filename || "image.jpg");
	formData.append("merchantId", String(merchantId));
	formData.append("type", type);
	formData.append("filename", filename || "image.jpg");

	const response = await fetch(`${WORKER_URL}/api/images/upload`, {
		method: "POST",
		body: formData, // Browser sets Content-Type: multipart/form-data automatically
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			(errorData as { error?: string }).error ||
				`Upload failed with status ${response.status}`,
		);
	}

	return response.json();
}
