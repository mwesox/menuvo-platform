import { S3Client } from "bun";
import { env } from "@/env";

/**
 * S3-compatible storage client using Bun's native S3 API.
 * Works with AWS S3, Cloudflare R2, MinIO, and other S3-compatible services.
 */
export const s3 = new S3Client({
	endpoint: env.S3_ENDPOINT,
	accessKeyId: env.S3_ACCESS_KEY_ID,
	secretAccessKey: env.S3_SECRET_ACCESS_KEY,
	bucket: env.S3_BUCKET,
	region: env.S3_REGION ?? "auto",
});

/**
 * Get the public URL for a given S3 key.
 */
export function getPublicUrl(key: string): string {
	return `${env.S3_PUBLIC_URL}/${key}`;
}

/**
 * Upload a file to S3 and return its public URL.
 */
export async function uploadFile(
	key: string,
	data: Buffer | Uint8Array | string,
	options?: { type?: string },
): Promise<string> {
	await s3.write(key, data, options);
	return getPublicUrl(key);
}

/**
 * Delete a file from S3.
 */
export async function deleteFile(key: string): Promise<void> {
	await s3.delete(key);
}

/**
 * Check if a file exists in S3.
 */
export async function fileExists(key: string): Promise<boolean> {
	return s3.exists(key);
}

/**
 * Get a file's contents as a Buffer.
 */
export async function getFileBuffer(key: string): Promise<Buffer> {
	const file = s3.file(key);
	return Buffer.from(await file.arrayBuffer());
}

/**
 * Generate a presigned URL for uploading (PUT) or downloading (GET).
 */
export function presignUrl(
	key: string,
	options?: {
		method?: "GET" | "PUT";
		expiresIn?: number;
		type?: string;
	},
): string {
	return s3.presign(key, {
		method: options?.method ?? "GET",
		expiresIn: options?.expiresIn ?? 3600,
		type: options?.type,
	});
}
