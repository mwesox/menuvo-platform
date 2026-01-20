import type { AppRouter } from "@menuvo/api/trpc";
import type { TRPCClient } from "@trpc/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { ImageType } from "../constants.ts";

type RouterOutput = inferRouterOutputs<AppRouter>;
type UploadImageResult = RouterOutput["image"]["upload"];

/**
 * Upload an image using tRPC with FormData.
 */
export async function uploadImageBinary(
	trpcClient: TRPCClient<AppRouter>,
	blob: Blob,
	merchantId: string,
	type: ImageType,
	filename?: string,
): Promise<UploadImageResult | undefined> {
	const formData = new FormData();
	formData.append("file", blob, filename || "image.jpg");
	formData.append("merchantId", String(merchantId));
	formData.append("type", type);
	formData.append("filename", filename || "image.jpg");

	const result = await trpcClient.image.upload.mutate(formData);
	console.log("[upload-image] Response:", result);
	return result;
}
