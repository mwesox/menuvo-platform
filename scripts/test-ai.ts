/**
 * AI Integration Test Script
 * Run with: bun --bun run scripts/test-ai.ts
 */

import { z } from "zod/v4";
import { getOpenRouterClient } from "../src/lib/ai/client";
import { aiMenuExtractionSchema } from "../src/features/console/menu-import/validation";

const TEST_MODEL = "nvidia/nemotron-3-nano-30b-a3b:free";

const SAMPLE_MENU_TEXT = `
APPETIZERS
Bruschetta - Fresh tomatoes, basil, garlic on toasted bread - $8.99
Calamari - Fried squid rings with marinara sauce - $12.50
Caesar Salad - Romaine, parmesan, croutons, caesar dressing - $9.00

MAIN COURSES
Margherita Pizza - Tomato, mozzarella, fresh basil - $14.99
Spaghetti Carbonara - Pasta with bacon, egg, parmesan - $16.00
Grilled Salmon - Atlantic salmon with vegetables - $22.50

DESSERTS
Tiramisu - Classic Italian dessert - $7.50
Gelato - Choice of vanilla, chocolate, or strawberry - $5.00
`;

async function testBasicChat() {
	console.log("\n=== Test 1: Basic Chat ===\n");

	const client = getOpenRouterClient();
	const response = await client.chat.send({
		model: TEST_MODEL,
		messages: [
			{ role: "user", content: "Say 'Hello, AI is working!' and nothing else." },
		],
	});

	const rawContent = response.choices[0]?.message?.content;
	const content = typeof rawContent === "string" ? rawContent : "(no response)";
	console.log("Response:", content);
	console.log("✓ Basic chat works\n");
}

async function testJsonOutput() {
	console.log("\n=== Test 2: JSON Output (no schema) ===\n");

	const client = getOpenRouterClient();
	const response = await client.chat.send({
		model: TEST_MODEL,
		messages: [
			{
				role: "system",
				content: "You are a JSON generator. Return only valid JSON, no explanations.",
			},
			{
				role: "user",
				content: `Extract menu items from this text and return as JSON with structure:
{ "items": [{ "name": "...", "price": 999 }] }

Menu:
${SAMPLE_MENU_TEXT}`,
			},
		],
		responseFormat: { type: "json_object" },
	});

	const rawContent2 = response.choices[0]?.message?.content;
	const content = typeof rawContent2 === "string" ? rawContent2 : "{}";
	console.log("Raw response:", content.slice(0, 500));

	try {
		const parsed = JSON.parse(content);
		console.log("Parsed type:", Array.isArray(parsed) ? "array" : typeof parsed);
		console.log("Keys:", Object.keys(parsed));
		console.log("✓ JSON output works\n");
	} catch (e) {
		console.error("✗ Failed to parse JSON:", e);
	}
}

async function testStructuredOutput() {
	console.log("\n=== Test 3: Structured Output (with schema) ===\n");

	const client = getOpenRouterClient();
	const jsonSchema = z.toJSONSchema(aiMenuExtractionSchema);

	console.log("Generated JSON Schema:");
	console.log(JSON.stringify(jsonSchema, null, 2));
	console.log("\n---\n");

	try {
		const response = await client.chat.send({
			model: TEST_MODEL,
			messages: [
				{
					role: "system",
					content: `You are a menu extraction specialist. Extract menu data and return valid JSON matching the exact schema provided.
Prices should be in CENTS (e.g., $9.99 = 999).`,
				},
				{
					role: "user",
					content: `Extract menu data from:\n\n${SAMPLE_MENU_TEXT}`,
				},
			],
			responseFormat: {
				type: "json_schema",
				jsonSchema: {
					name: "MenuExtraction",
					schema: jsonSchema,
					strict: true,
				},
			},
		});

		const rawContent3 = response.choices[0]?.message?.content;
		const content = typeof rawContent3 === "string" ? rawContent3 : "{}";
		console.log("Raw response (first 1000 chars):");
		console.log(content.slice(0, 1000));
		console.log("\n---\n");

		const parsed = JSON.parse(content);
		console.log("Parsed type:", Array.isArray(parsed) ? "array" : typeof parsed);

		if (Array.isArray(parsed)) {
			console.log("⚠ AI returned an array instead of object!");
			console.log("First element:", JSON.stringify(parsed[0], null, 2).slice(0, 200));
		} else {
			console.log("Keys:", Object.keys(parsed));

			// Try to validate with schema
			const validated = aiMenuExtractionSchema.parse(parsed);
			console.log("✓ Schema validation passed!");
			console.log(`  Categories: ${validated.categories.length}`);
			console.log(`  Option groups: ${validated.optionGroups.length}`);
			console.log(`  Confidence: ${validated.confidence}`);
		}
	} catch (e) {
		console.error("✗ Structured output failed:", e);
	}
}

async function testMenuExtractor() {
	console.log("\n=== Test 4: Full Menu Extractor ===\n");

	const { extractMenuFromText } = await import(
		"../src/features/console/menu-import/logic/ai-extractor"
	);

	try {
		const result = await extractMenuFromText(SAMPLE_MENU_TEXT, {
			model: {
				id: TEST_MODEL,
				supportsStructuredOutput: false,
			},
		});

		console.log("✓ Extraction successful!");
		console.log(`  Categories: ${result.categories.length}`);
		for (const cat of result.categories) {
			console.log(`    - ${cat.name}: ${cat.items.length} items`);
		}
		console.log(`  Option groups: ${result.optionGroups.length}`);
		console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
	} catch (e) {
		console.error("✗ Menu extractor failed:", e);
	}
}

async function main() {
	console.log("========================================");
	console.log("        AI Integration Test Suite       ");
	console.log("========================================");
	console.log(`Model: ${TEST_MODEL}`);

	try {
		await testBasicChat();
		await testJsonOutput();
		await testStructuredOutput();
		await testMenuExtractor();
	} catch (e) {
		console.error("\n✗ Test suite failed:", e);
	}

	console.log("\n========================================");
	console.log("              Tests Complete            ");
	console.log("========================================\n");
}

main();
