/**
 * Menu Import E2E Test Script
 *
 * Tests the complete menu import flow:
 * 1. AI extraction from various file formats
 * 2. Text extraction
 * 3. Comparison generation
 *
 * Run with: bun --bun run scripts/test-menu-import-e2e.ts
 *
 * Options:
 *   --file=<path>     Test specific file (default: all test files)
 *   --model=<id>      Use specific model (default: nemotron free)
 *   --structured      Force structured output mode
 *   --verbose         Show detailed output
 */

import { parseArgs } from "util";
import { extractMenuFromText, type ModelConfig } from "../src/features/console/menu-import/logic/ai-extractor";
import { extractTextFromFile } from "../src/features/console/menu-import/logic/text-extractor";
import { compareMenus } from "../src/features/console/menu-import/logic/comparer";
import type { AllowedFileType } from "../src/features/console/menu-import/schemas";

const TEST_DATA_DIR = "./scripts/test-data";

// Available test files
const TEST_FILES: Array<{ path: string; type: AllowedFileType }> = [
	{ path: `${TEST_DATA_DIR}/menu-simple.csv`, type: "csv" },
	{ path: `${TEST_DATA_DIR}/menu-structured.json`, type: "json" },
	{ path: `${TEST_DATA_DIR}/menu-unstructured.txt`, type: "txt" },
];

// Default model config
const DEFAULT_MODEL: ModelConfig = {
	id: "nvidia/nemotron-3-nano-30b-a3b:free",
	supportsStructuredOutput: false,
};

// Mock existing menu for comparison testing
const MOCK_EXISTING_MENU = {
	categories: [
		{
			id: "cat-1",
			name: "Vorspeisen",
			description: "Starters",
			items: [
				{ id: "item-1", name: "Bruschetta", description: "Mit Tomaten", price: 599, allergens: ["gluten"] },
			],
		},
	],
	optionGroups: [],
};

interface TestResult {
	file: string;
	success: boolean;
	duration: number;
	extractedText?: number;
	categories?: number;
	items?: number;
	optionGroups?: number;
	confidence?: number;
	comparison?: {
		newCategories: number;
		updatedCategories: number;
		newItems: number;
		updatedItems: number;
	};
	error?: string;
}

async function testFile(
	filePath: string,
	fileType: AllowedFileType,
	model: ModelConfig,
	verbose: boolean,
): Promise<TestResult> {
	const startTime = Date.now();
	const result: TestResult = {
		file: filePath.split("/").pop() || filePath,
		success: false,
		duration: 0,
	};

	try {
		// Step 1: Read file
		if (verbose) console.log(`  Reading file...`);
		const file = Bun.file(filePath);
		const exists = await file.exists();
		if (!exists) {
			throw new Error(`File not found: ${filePath}`);
		}
		const buffer = Buffer.from(await file.arrayBuffer());

		// Step 2: Extract text
		if (verbose) console.log(`  Extracting text from ${fileType}...`);
		const { text } = extractTextFromFile(buffer, fileType);
		result.extractedText = text.length;
		if (verbose) console.log(`  Extracted ${text.length} characters`);

		// Step 3: AI extraction
		if (verbose) console.log(`  Running AI extraction with ${model.id}...`);
		const extracted = await extractMenuFromText(text, {
			model,
			existingCategories: MOCK_EXISTING_MENU.categories.map((c) => c.name),
			existingItems: MOCK_EXISTING_MENU.categories.flatMap((c) =>
				c.items.map((i) => i.name),
			),
		});

		result.categories = extracted.categories.length;
		result.items = extracted.categories.reduce((sum, c) => sum + c.items.length, 0);
		result.optionGroups = extracted.optionGroups.length;
		result.confidence = extracted.confidence;

		if (verbose) {
			console.log(`  Extracted:`);
			console.log(`    - ${result.categories} categories`);
			console.log(`    - ${result.items} items`);
			console.log(`    - ${result.optionGroups} option groups`);
			console.log(`    - ${(result.confidence * 100).toFixed(0)}% confidence`);
		}

		// Step 4: Generate comparison
		if (verbose) console.log(`  Generating comparison...`);
		const comparison = compareMenus(extracted, MOCK_EXISTING_MENU);

		result.comparison = {
			newCategories: comparison.summary.newCategories,
			updatedCategories: comparison.summary.updatedCategories,
			newItems: comparison.summary.newItems,
			updatedItems: comparison.summary.updatedItems,
		};

		if (verbose) {
			console.log(`  Comparison:`);
			console.log(`    - ${result.comparison.newCategories} new categories`);
			console.log(`    - ${result.comparison.updatedCategories} updated categories`);
			console.log(`    - ${result.comparison.newItems} new items`);
			console.log(`    - ${result.comparison.updatedItems} updated items`);
		}

		result.success = true;
	} catch (error) {
		result.error = error instanceof Error ? error.message : String(error);
		if (verbose) console.log(`  ERROR: ${result.error}`);
	}

	result.duration = Date.now() - startTime;
	return result;
}

function printSummary(results: TestResult[]) {
	console.log("\n" + "=".repeat(70));
	console.log("                         TEST SUMMARY");
	console.log("=".repeat(70));

	const passed = results.filter((r) => r.success).length;
	const failed = results.filter((r) => !r.success).length;

	console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

	// Table header
	console.log(
		"File".padEnd(25) +
		"Status".padEnd(10) +
		"Time".padEnd(10) +
		"Cat".padEnd(6) +
		"Items".padEnd(8) +
		"Conf".padEnd(8)
	);
	console.log("-".repeat(70));

	for (const r of results) {
		const status = r.success ? "✓ PASS" : "✗ FAIL";
		const time = `${r.duration}ms`;
		const cats = r.categories?.toString() || "-";
		const items = r.items?.toString() || "-";
		const conf = r.confidence ? `${(r.confidence * 100).toFixed(0)}%` : "-";

		console.log(
			r.file.padEnd(25) +
			status.padEnd(10) +
			time.padEnd(10) +
			cats.padEnd(6) +
			items.padEnd(8) +
			conf.padEnd(8)
		);

		if (!r.success && r.error) {
			console.log(`  └─ Error: ${r.error.slice(0, 50)}...`);
		}
	}

	console.log("\n" + "=".repeat(70));
}

async function main() {
	const { values } = parseArgs({
		args: Bun.argv.slice(2),
		options: {
			file: { type: "string" },
			model: { type: "string" },
			structured: { type: "boolean", default: false },
			verbose: { type: "boolean", short: "v", default: false },
			help: { type: "boolean", short: "h", default: false },
		},
	});

	if (values.help) {
		console.log(`
Menu Import E2E Test

Usage: bun --bun run scripts/test-menu-import-e2e.ts [options]

Options:
  --file=<path>     Test specific file
  --model=<id>      Use specific OpenRouter model ID
  --structured      Force structured output mode
  --verbose, -v     Show detailed output
  --help, -h        Show this help

Examples:
  bun --bun run scripts/test-menu-import-e2e.ts
  bun --bun run scripts/test-menu-import-e2e.ts --verbose
  bun --bun run scripts/test-menu-import-e2e.ts --file=./scripts/test-data/menu-simple.csv
  bun --bun run scripts/test-menu-import-e2e.ts --model=openai/gpt-4o-mini --structured
`);
		return;
	}

	console.log("=".repeat(70));
	console.log("              MENU IMPORT E2E TEST SUITE");
	console.log("=".repeat(70));

	// Configure model
	const model: ModelConfig = {
		id: values.model || DEFAULT_MODEL.id,
		supportsStructuredOutput: values.structured || false,
	};

	console.log(`\nModel: ${model.id}`);
	console.log(`Mode: ${model.supportsStructuredOutput ? "structured" : "chat"}`);
	console.log(`Verbose: ${values.verbose ? "yes" : "no"}\n`);

	// Determine which files to test
	let filesToTest = TEST_FILES;
	if (values.file) {
		const ext = values.file.split(".").pop() as AllowedFileType;
		filesToTest = [{ path: values.file, type: ext }];
	}

	// Check if test files exist
	const existingFiles: Array<{ path: string; type: AllowedFileType }> = [];
	for (const f of filesToTest) {
		const exists = await Bun.file(f.path).exists();
		if (exists) {
			existingFiles.push(f);
		} else {
			console.log(`⚠ Skipping ${f.path} (not found)`);
		}
	}

	if (existingFiles.length === 0) {
		console.log("\n⚠ No test files found!");
		console.log("Run: bun --bun run scripts/generate-test-xlsx.ts");
		return;
	}

	// Run tests
	const results: TestResult[] = [];
	for (const { path, type } of existingFiles) {
		console.log(`\nTesting: ${path}`);
		console.log("-".repeat(50));

		const result = await testFile(path, type, model, values.verbose || false);
		results.push(result);

		if (!values.verbose) {
			if (result.success) {
				console.log(`  ✓ Passed (${result.duration}ms) - ${result.categories} categories, ${result.items} items`);
			} else {
				console.log(`  ✗ Failed: ${result.error}`);
			}
		}
	}

	// Print summary
	printSummary(results);

	// Exit with error code if any tests failed
	const allPassed = results.every((r) => r.success);
	process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
