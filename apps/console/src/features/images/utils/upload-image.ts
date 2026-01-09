import type { ImageType } from "@menuvo/trpc/schemas";
import { trpcClient } from "@/lib/trpc";

/**
 * Upload an image using tRPC with FormData.
 */
export async function uploadImageBinary(
	blob: Blob,
	merchantId: string,
	type: ImageType,
	filename?: string,
): Promise<any> {
	const formData = new FormData();
	formData.append("file", blob, filename || "image.jpg");
	formData.append("merchantId", String(merchantId));
	formData.append("type", type);
	formData.append("filename", filename || "image.jpg");

	const result = await trpcClient.image.upload.mutate(formData);
	console.log("[upload-image] Response:", result);
	return result;
}
