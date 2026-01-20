/**
 * Tests for AI extractor text normalization functions
 */

// Copy of the function for testing (since it's not exported)
function normalizeTextCase(text: string): string {
	const trimmed = text.trim();
	if (!trimmed) return trimmed;
	// Use Unicode-aware pattern to handle German umlauts and other non-ASCII characters
	// Match the first letter after start of string or whitespace
	return trimmed
		.toLowerCase()
		.replace(
			/(^|\s)(\p{L})/gu,
			(_, prefix, letter) => prefix + letter.toUpperCase(),
		);
}

function formatCategoryName(key: string): string {
	// Use Unicode-aware pattern to handle German umlauts
	return key
		.replace(/_/g, " ")
		.toLowerCase()
		.replace(
			/(^|\s)(\p{L})/gu,
			(_, prefix, letter) => prefix + letter.toUpperCase(),
		);
}

// Test cases for normalizeTextCase
const normalizeTests: [string, string][] = [
	// German umlauts - the main bug fix
	["Kuchen & Gebäck", "Kuchen & Gebäck"],
	["KUCHEN & GEBÄCK", "Kuchen & Gebäck"],
	["kuchen & gebäck", "Kuchen & Gebäck"],

	// More German characters
	["café & müsli", "Café & Müsli"],
	["desserts und süße speisen", "Desserts Und Süße Speisen"],
	["getränke", "Getränke"],
	["öl & essig", "Öl & Essig"],
	["größe auswählen", "Größe Auswählen"],

	// Regular English
	["pizza margherita", "Pizza Margherita"],
	["PIZZA MARGHERITA", "Pizza Margherita"],
	["main course", "Main Course"],

	// Edge cases
	["", ""],
	["  ", ""],
	["a", "A"],
];

// Test cases for formatCategoryName
const formatTests: [string, string][] = [
	["main_course", "Main Course"],
	["süße_speisen", "Süße Speisen"],
	["getränke_alkoholfrei", "Getränke Alkoholfrei"],
	["PIZZA_PASTA", "Pizza Pasta"],
];

let allPassed = true;

console.log("Testing normalizeTextCase:");
for (const [input, expected] of normalizeTests) {
	const result = normalizeTextCase(input);
	const passed = result === expected;
	if (!passed) allPassed = false;
	console.log(
		passed ? "✓" : "✗",
		`"${input}" → "${result}"${passed ? "" : ` (expected: "${expected}")`}`,
	);
}

console.log("\nTesting formatCategoryName:");
for (const [input, expected] of formatTests) {
	const result = formatCategoryName(input);
	const passed = result === expected;
	if (!passed) allPassed = false;
	console.log(
		passed ? "✓" : "✗",
		`"${input}" → "${result}"${passed ? "" : ` (expected: "${expected}")`}`,
	);
}

console.log(allPassed ? "\n✓ All tests passed!" : "\n✗ Some tests failed!");
process.exit(allPassed ? 0 : 1);
