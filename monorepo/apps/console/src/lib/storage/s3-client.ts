import { S3Client } from "bun";

/**
 * S3-compatible storage client using Bun's native S3 API.
 * Works with AWS S3, Cloudflare R2, MinIO, and other S3-compatible services.
 */
export const s3 = new S3Client({
	endpoint: process.env.S3_ENDPOINT!,
	accessKeyId: process.env.S3_ACCESS_KEY_ID!,
	secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
	bucket: process.env.S3_BUCKET!,
	region: process.env.S3_REGION ?? "auto",
});

/**
 * Get the public URL for a given S3 key.
 */
export function getPublicUrl(key: string): string {
	return `${process.env.S3_PUBLIC_URL}/${key}`;
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
export async function getFile(key: string): Promise<Buffer> {
	const response = await s3.file(key);
	return Buffer.from(await response.arrayBuffer());
}