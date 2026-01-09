import { S3Client } from "bun";

// Validate required environment variables
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_BUCKET = process.env.S3_BUCKET;

if (!S3_ENDPOINT || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET) {
	throw new Error(
		"Missing required S3 environment variables: S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET",
	);
}

/**
 * S3-compatible storage client using Bun's native S3 API.
 * Works with AWS S3, Cloudflare R2, MinIO, and other S3-compatible services.
 */
export const s3 = new S3Client({
	endpoint: S3_ENDPOINT,
	accessKeyId: S3_ACCESS_KEY_ID,
	secretAccessKey: S3_SECRET_ACCESS_KEY,
	bucket: S3_BUCKET,
	region: process.env.S3_REGION ?? "auto",
});

/**
 * Get the URL for a given S3 key.
 */
export function getUrl(key: string): string {
	return `${process.env.S3_BASE_URL}/${key}`;
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
	return getUrl(key);
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

/**
 * Get a file's contents as a Buffer (alias for getFile).
 */
export const getFileBuffer = getFile;
