/**
 * Test script to explore the Mollie Capabilities API
 *
 * Purpose: Discover the response structure of the new Capabilities API
 * before implementing the migration from the deprecated Onboarding API.
 *
 * Run with: bun run scripts/test-mollie-capabilities.ts [merchantId]
 *
 * If merchantId is not provided, finds the first merchant with Mollie tokens.
 */

import "dotenv/config";
import postgres from "postgres";

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!DATABASE_URL) {
	console.error("❌ DATABASE_URL is required");
	process.exit(1);
}

if (!ENCRYPTION_KEY) {
	console.error("❌ ENCRYPTION_KEY is required for decrypting tokens");
	process.exit(1);
}

// Mollie API endpoints
const MOLLIE_ONBOARDING_ENDPOINT = "https://api.mollie.com/v2/onboarding/me";
const MOLLIE_CAPABILITIES_ENDPOINT = "https://api.mollie.com/v2/capabilities";

// Crypto constants (same as src/lib/crypto.ts)
const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;
const TAG_LENGTH = 128;

/**
 * Decrypt a token encrypted with AES-256-GCM
 */
async function decryptToken(encrypted: string): Promise<string> {
	// Convert hex key to bytes
	const keyBytes = new Uint8Array(
		ENCRYPTION_KEY!.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ||
			[],
	);

	if (keyBytes.length !== 32) {
		throw new Error(
			"ENCRYPTION_KEY must be 64 hex characters (32 bytes / 256 bits)",
		);
	}

	const key = await crypto.subtle.importKey(
		"raw",
		keyBytes,
		{ name: ALGORITHM },
		false,
		["decrypt"],
	);

	// Decode base64
	const combined = Buffer.from(encrypted, "base64");

	// Extract IV and ciphertext
	const iv = combined.subarray(0, IV_LENGTH);
	const ciphertext = combined.subarray(IV_LENGTH);

	// Decrypt
	const decrypted = await crypto.subtle.decrypt(
		{ name: ALGORITHM, iv, tagLength: TAG_LENGTH },
		key,
		ciphertext,
	);

	return new TextDecoder().decode(decrypted);
}

/**
 * Fetch from Mollie API with proper error handling
 */
async function fetchMollieApi(
	endpoint: string,
	accessToken: string,
): Promise<{ status: number; data: unknown }> {
	try {
		const response = await fetch(endpoint, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		const data = await response.json();
		return { status: response.status, data };
	} catch (error) {
		return {
			status: 0,
			data: { error: error instanceof Error ? error.message : String(error) },
		};
	}
}

async function main() {
	console.log("\n🔍 Mollie Capabilities API Test\n");
	console.log("=".repeat(60));

	// Get optional merchantId from command line
	const merchantIdArg = process.argv[2];
	const merchantId = merchantIdArg ? Number.parseInt(merchantIdArg, 10) : null;

	// Connect to database
	console.log("\n📦 Connecting to database...");
	const sql = postgres(DATABASE_URL!);

	try {
		// Find a merchant with Mollie tokens
		let query: string;
		let values: unknown[];

		if (merchantId) {
			query = `
				SELECT id, name, mollie_access_token, mollie_organization_id, mollie_onboarding_status
				FROM merchants
				WHERE id = $1 AND mollie_access_token IS NOT NULL
				LIMIT 1
			`;
			values = [merchantId];
		} else {
			query = `
				SELECT id, name, mollie_access_token, mollie_organization_id, mollie_onboarding_status
				FROM merchants
				WHERE mollie_access_token IS NOT NULL
				LIMIT 1
			`;
			values = [];
		}

		// biome-ignore lint/suspicious/noExplicitAny: test script with raw SQL
		const merchants = (await sql.unsafe(query, values as any)) as Array<{
			id: number;
			name: string;
			mollie_access_token: string;
			mollie_organization_id: string | null;
			mollie_onboarding_status: string | null;
		}>;

		if (merchants.length === 0) {
			console.error("\n❌ No merchant found with Mollie tokens");
			if (merchantId) {
				console.error(
					`   Merchant ID ${merchantId} either doesn't exist or has no Mollie tokens`,
				);
			}
			process.exit(1);
		}

		const merchant = merchants[0];

		console.log(`\n✅ Found merchant:`);
		console.log(`   ID: ${merchant.id}`);
		console.log(`   Name: ${merchant.name}`);
		console.log(`   Mollie Org ID: ${merchant.mollie_organization_id || "N/A"}`);
		console.log(`   Current Status: ${merchant.mollie_onboarding_status || "N/A"}`);

		// Decrypt access token
		console.log("\n🔐 Decrypting access token...");
		const accessToken = await decryptToken(merchant.mollie_access_token);
		console.log(`   Token preview: ${accessToken.substring(0, 20)}...`);

		// Test 1: Deprecated Onboarding API
		console.log("\n" + "=".repeat(60));
		console.log("\n📡 Test 1: Deprecated Onboarding API");
		console.log(`   Endpoint: GET ${MOLLIE_ONBOARDING_ENDPOINT}`);
		console.log("-".repeat(60));

		const onboardingResult = await fetchMollieApi(
			MOLLIE_ONBOARDING_ENDPOINT,
			accessToken,
		);

		console.log(`   Status: ${onboardingResult.status}`);
		console.log("\n   Response:");
		console.log(JSON.stringify(onboardingResult.data, null, 2));

		// Test 2: New Capabilities API
		console.log("\n" + "=".repeat(60));
		console.log("\n📡 Test 2: New Capabilities API (Beta)");
		console.log(`   Endpoint: GET ${MOLLIE_CAPABILITIES_ENDPOINT}`);
		console.log("-".repeat(60));

		const capabilitiesResult = await fetchMollieApi(
			MOLLIE_CAPABILITIES_ENDPOINT,
			accessToken,
		);

		console.log(`   Status: ${capabilitiesResult.status}`);
		console.log("\n   Response:");
		console.log(JSON.stringify(capabilitiesResult.data, null, 2));

		// Analysis
		console.log("\n" + "=".repeat(60));
		console.log("\n📊 Analysis");
		console.log("-".repeat(60));

		if (onboardingResult.status === 200 && capabilitiesResult.status === 200) {
			console.log("\n✅ Both APIs responded successfully!");
			console.log("\nKey differences to note for migration:");
			console.log("- Onboarding API response structure");
			console.log("- Capabilities API response structure");
			console.log("- How to map capabilities to onboarding status");
		} else {
			console.log("\n⚠️ One or more APIs failed:");
			if (onboardingResult.status !== 200) {
				console.log(`   - Onboarding API: ${onboardingResult.status}`);
			}
			if (capabilitiesResult.status !== 200) {
				console.log(`   - Capabilities API: ${capabilitiesResult.status}`);
			}
		}

		console.log("\n" + "=".repeat(60));
		console.log("\n");
	} finally {
		await sql.end();
	}
}

main().catch((error) => {
	console.error("\n❌ Script failed:", error);
	process.exit(1);
});
