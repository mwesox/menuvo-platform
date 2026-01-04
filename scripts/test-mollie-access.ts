/**
 * Test script to check Mollie Partner/Connect API access
 * Run with: bun run scripts/test-mollie-access.ts
 */

import "dotenv/config";

const MOLLIE_CLIENT_ID = process.env.MOLLIE_CLIENT_ID;
const MOLLIE_CLIENT_SECRET = process.env.MOLLIE_CLIENT_SECRET;
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY;
const MOLLIE_ORG_TOKEN = process.env.MOLLIE_ORG_ACCESS_TOKEN;

console.log("\n🔍 Mollie Access Test\n");
console.log("=".repeat(50));

// Check environment variables
console.log("\n📋 Environment Variables:");
console.log(`  MOLLIE_CLIENT_ID: ${MOLLIE_CLIENT_ID ? "✅ Set" : "❌ Missing"}`);
console.log(`  MOLLIE_CLIENT_SECRET: ${MOLLIE_CLIENT_SECRET ? "✅ Set" : "❌ Missing"}`);
console.log(`  MOLLIE_API_KEY: ${MOLLIE_API_KEY ? "✅ Set" : "❌ Missing"}`);
console.log(`  MOLLIE_ORG_ACCESS_TOKEN: ${MOLLIE_ORG_TOKEN ? "✅ Set" : "⚠️ Not set"}`);

// Test 1: Check if API key works (basic API access)
console.log("\n\n📡 Test 1: Basic API Access (API Key)");
console.log("-".repeat(50));

try {
	const response = await fetch("https://api.mollie.com/v2/methods", {
		headers: {
			Authorization: `Bearer ${MOLLIE_API_KEY}`,
		},
	});

	if (response.ok) {
		const data = await response.json();
		console.log(`  ✅ API Key works! Found ${data.count} payment methods`);
	} else {
		const error = await response.text();
		console.log(`  ❌ API Key failed: ${response.status} ${response.statusText}`);
		console.log(`     ${error}`);
	}
} catch (error) {
	console.log(`  ❌ Error: ${error}`);
}

// Test 2: Check Client Links API with Organization Access Token
console.log("\n\n📡 Test 2: Client Links API (Organization Access Token)");
console.log("-".repeat(50));

if (!MOLLIE_ORG_TOKEN) {
	console.log("  ⚠️ MOLLIE_ORG_ACCESS_TOKEN not set. Skipping this test.");
	console.log("     Create one in Dashboard → Developers → Organization access tokens");
	console.log("     Make sure to include 'clients.write' permission.");
} else {
	try {
		const response = await fetch("https://api.mollie.com/v2/client-links", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${MOLLIE_ORG_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				owner: {
					email: "test@example.com",
					givenName: "Test",
					familyName: "User",
				},
				name: "Test Restaurant",
				address: {
					country: "DE",
				},
			}),
		});

		if (response.ok) {
			const data = await response.json();
			console.log(`  ✅ Client Links API WORKS!`);
			console.log(`     Client Link ID: ${data.id}`);
			console.log(`     Link URL: ${data._links?.clientLink?.href}`);
			console.log("\n  🎉 You can create merchant accounts via API!");
		} else {
			const error = await response.json().catch(() => response.text());
			console.log(`  ❌ Status: ${response.status} ${response.statusText}`);
			console.log(`     Response: ${JSON.stringify(error, null, 2)}`);

			if (response.status === 401) {
				console.log("\n  ⚠️  Token unauthorized. Check if it has 'clients.write' permission.");
			} else if (response.status === 403) {
				console.log("\n  ⚠️  Access forbidden. You may need Partner status.");
			}
		}
	} catch (error) {
		console.log(`  ❌ Error: ${error}`);
	}
}

// Test 3: Check OAuth app info
console.log("\n\n📡 Test 3: OAuth App Verification");
console.log("-".repeat(50));
console.log(`  App ID: ${MOLLIE_CLIENT_ID}`);
console.log(`  Type: ${MOLLIE_CLIENT_ID?.startsWith("app_") ? "✅ Valid OAuth App" : "❌ Invalid format"}`);

console.log("\n" + "=".repeat(50));
console.log("\n");
