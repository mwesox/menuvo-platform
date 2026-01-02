import { S3Client } from "bun";
import { env } from "@/env";

/**
 * S3-compatible storage client for internal files (imports, etc.).
 * Uses the S3_FILES_BUCKET which is NOT publicly accessible.
 * Uses the same credentials as the public bucket but different bucket name.
 */
export const filesStorage = new S3Client({
	endpoint: env.S3_ENDPOINT,
	accessKeyId: env.S3_ACCESS_KEY_ID,
	secretAccessKey: env.S3_SECRET_ACCESS_KEY,
	bucket: env.S3_FILES_BUCKET ?? "menuvo-files",
	region: env.S3_REGION ?? "auto",
});

/**
 * Upload a file to the internal files bucket.
 */
export async function uploadFile(
	key: string,
	data: Buffer | Uint8Array | string,
	options?: { type?: string },
): Promise<void> {
	await filesStorage.write(key, data, options);
}

/**
 * Get a file from the internal files bucket.
 */
export async function getFile(key: string): Promise<Buffer> {
	const file = filesStorage.file(key);
	return Buffer.from(await file.arrayBuffer());
}

/**
 * Delete a file from the internal files bucket.
 */
export async function deleteFile(key: string): Promise<void> {
	await filesStorage.delete(key);
}

/**
 * Check if a file exists in the internal files bucket.
 */
export async function fileExists(key: string): Promise<boolean> {
	return filesStorage.exists(key);
}
