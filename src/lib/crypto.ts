/**
 * Token Encryption Utilities
 *
 * Provides AES-256-GCM encryption for storing sensitive OAuth tokens.
 * Uses the Web Crypto API (supported in Bun, Node, and browsers).
 */

import { env } from "@/env";

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 128; // 128 bits for GCM

/**
 * Gets the encryption key from environment.
 * Key should be 32 bytes (256 bits) hex-encoded.
 */
async function getEncryptionKey(): Promise<CryptoKey> {
	const keyHex = env.ENCRYPTION_KEY;
	if (!keyHex) {
		throw new Error("ENCRYPTION_KEY is not configured");
	}

	// Convert hex string to bytes
	const keyBytes = new Uint8Array(
		keyHex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [],
	);

	if (keyBytes.length !== 32) {
		throw new Error(
			"ENCRYPTION_KEY must be 64 hex characters (32 bytes / 256 bits)",
		);
	}

	return crypto.subtle.importKey("raw", keyBytes, { name: ALGORITHM }, false, [
		"encrypt",
		"decrypt",
	]);
}

/**
 * Converts Uint8Array to base64 string (Web-standard, works in browser + server)
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Converts base64 string to Uint8Array (Web-standard, works in browser + server)
 */
function base64ToUint8Array(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

/**
 * Encrypts a string value using AES-256-GCM.
 * Returns a base64-encoded string containing IV + ciphertext + tag.
 */
export async function encryptToken(plaintext: string): Promise<string> {
	const key = await getEncryptionKey();

	// Generate random IV
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

	// Encrypt
	const encoder = new TextEncoder();
	const ciphertext = await crypto.subtle.encrypt(
		{ name: ALGORITHM, iv, tagLength: TAG_LENGTH },
		key,
		encoder.encode(plaintext),
	);

	// Combine IV + ciphertext (tag is appended by GCM)
	const combined = new Uint8Array(iv.length + ciphertext.byteLength);
	combined.set(iv, 0);
	combined.set(new Uint8Array(ciphertext), iv.length);

	// Return as base64 (using Web-standard APIs instead of Node.js Buffer)
	return uint8ArrayToBase64(combined);
}

/**
 * Decrypts a base64-encoded string that was encrypted with encryptToken.
 * Returns the original plaintext.
 */
export async function decryptToken(encrypted: string): Promise<string> {
	const key = await getEncryptionKey();

	// Decode base64 (using Web-standard APIs instead of Node.js Buffer)
	const combined = base64ToUint8Array(encrypted);

	// Extract IV and ciphertext (use slice to get proper ArrayBuffer types)
	const iv = combined.slice(0, IV_LENGTH);
	const ciphertext = combined.slice(IV_LENGTH);

	// Decrypt
	const decrypted = await crypto.subtle.decrypt(
		{ name: ALGORITHM, iv, tagLength: TAG_LENGTH },
		key,
		ciphertext,
	);

	// Return as string
	const decoder = new TextDecoder();
	return decoder.decode(decrypted);
}
