import type { Image, ImageType } from "@/db/schema.ts";

/**
 * Upload an image using binary FormData (no base64 encoding).
 *
 * This provides ~33% smaller network payload compared to base64.
 * The browser automatically sets Content-Type: multipart/form-data.
 */
export async function uploadImageBinary(
	blob: Blob,
	merchantId: string,
	type: ImageType,
	filename?: string,
): Promise<Image> {
	const formData = new FormData();
	formData.append("file", blob, filename || "image.jpg");
	formData.append("merchantId", String(merchantId));
	formData.append("type", type);
	formData.append("filename", filename || "image.jpg");

	const response = await fetch("/api/images/upload", {
		method: "POST",
		body: formData,
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
