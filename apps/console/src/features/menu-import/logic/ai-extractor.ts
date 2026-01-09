/**
 * AI Menu Extractor - Pure Utility Functions
 *
 * NOTE: The actual AI extraction has been moved to the API.
 * This file contains only pure helper functions for sanitization,
 * parsing, and content filtering that can be used by the API or tests.
 *
 * For AI extraction, use the tRPC `import.extractMenu` procedure.
 */

import type { AIMenuExtraction } from "../schemas";

// ============================================================================
// Sanitization & Security
// ============================================================================

/**
 * Patterns that indicate potential prompt injection attempts.
 * These are replaced with [FILTERED] to neutralize them while preserving text structure.
 */
const INJECTION_PATTERNS = [
	/ignore\s+(all\s+)?(previous|above|prior|earlier)\s+instructions?/gi,
	/disregard\s+(all\s+)?(previous|above|prior|earlier)\s+instructions?/gi,
	/forget\s+(everything|all|your|the\s+previous)/gi,
	/system\s*:/gi,
	/assistant\s*:/gi,
	/\[INST\]/gi,
	/<<SYS>>/gi,
	/<\|im_start\|>/gi,
	/<\|im_end\|>/gi,
	/you\s+are\s+now\s+(a|an)/gi,
	/new\s+(role|instructions?|task)\s*:/gi,
	/from\s+now\s+on/gi,
	/pretend\s+(you|to\s+be)/gi,
	/act\s+as\s+(if|a|an)/gi,
	/roleplay\s+as/gi,
	/override\s+(previous|all|your)/gi,
	/do\s+not\s+follow\s+(the|your|previous)/gi,
];

/**
 * Sanitize menu text to neutralize potential prompt injection patterns.
 * Returns the sanitized text and a flag indicating if suspicious content was detected.
 * @internal Exported for testing
 */
export function sanitizeMenuText(text: string): {
	sanitized: string;
	suspicious: boolean;
} {
	let sanitized = text;
	let suspicious = false;

	for (const pattern of INJECTION_PATTERNS) {
		if (pattern.test(sanitized)) {
			suspicious = true;
			// Reset lastIndex since we're reusing the regex
			pattern.lastIndex = 0;
			// Replace with harmless placeholder to preserve text structure
			sanitized = sanitized.replace(pattern, "[FILTERED]");
		}
	}

	return { sanitized, suspicious };
}

// ============================================================================
// Response Parsing
// ============================================================================

/**
 * Parse AI response, handling various formats free models might return.
 * Exported for use by the API's menu extraction service.
 */
export
function parseAIResponse(content: string): AIMenuExtraction {
	// Clean up markdown code blocks if present
	let cleaned = content.trim();
	if (cleaned.startsWith("```json")) {
		cleaned = cleaned.slice(7);
	} else if (cleaned.startsWith("```")) {
		cleaned = cleaned.slice(3);
	}
	if (cleaned.endsWith("```")) {
		cleaned = cleaned.slice(0, -3);
	}
	cleaned = cleaned.trim();

	const parsed = JSON.parse(cleaned);

	// If AI returned our expected format, use it directly
	if (
		parsed.categories &&
		Array.isArray(parsed.categories) &&
		parsed.optionGroups !== undefined
	) {
		return {
			categories: parsed.categories.map(normalizeCategory),
			optionGroups: parsed.optionGroups || [],
			confidence:
				typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
		};
	}

	// AI returned category names as keys (e.g., { "appetizers": [...], "main_courses": [...] })
	// Transform to our expected format
	const categories: AIMenuExtraction["categories"] = [];

	for (const [key, value] of Object.entries(parsed)) {
		// Skip known non-category keys
		if (
			key === "confidence" ||
			key === "optionGroups" ||
			key === "option_groups"
		) {
			continue;
		}

		if (Array.isArray(value)) {
			const categoryName = formatCategoryName(key);
			const items = (value as Array<Record<string, unknown>>).map((item) =>
				normalizeItem(item, categoryName),
			);
			categories.push({
				name: categoryName,
				description: undefined,
				items,
			});
		}
	}

	// Extract option groups if present
	const optionGroups =
		parsed.optionGroups || parsed.option_groups || parsed.options || [];

	// Extract confidence if present
	const confidence =
		typeof parsed.confidence === "number" ? parsed.confidence : 0.7;

	return { categories, optionGroups, confidence };
}

/**
 * Format category key to proper name.
 */
function formatCategoryName(key: string): string {
	// "main_courses" -> "Main Courses"
	return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Normalize text to title case (first letter of each word uppercase, rest lowercase).
 * Trims whitespace.
 */
function normalizeTextCase(text: string): string {
	const trimmed = text.trim();
	if (!trimmed) return trimmed;
	return trimmed.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Normalize a category object.
 */
function normalizeCategory(
	cat: Record<string, unknown>,
): AIMenuExtraction["categories"][0] {
	const name = normalizeTextCase(String(cat.name || "Unknown Category"));
	const items = Array.isArray(cat.items)
		? cat.items.map((item: Record<string, unknown>) =>
				normalizeItem(item, name),
			)
		: [];

	return {
		name,
		description: cat.description ? String(cat.description) : undefined,
		items,
	};
}

/**
 * Normalize an item object.
 */
function normalizeItem(
	item: Record<string, unknown>,
	categoryName: string,
): AIMenuExtraction["categories"][0]["items"][0] {
	return {
		name: normalizeTextCase(String(item.name || "Unknown Item")),
		description: item.description ? String(item.description) : undefined,
		price: typeof item.price === "number" ? item.price : 0,
		allergens: Array.isArray(item.allergens)
			? item.allergens.map(String)
			: undefined,
		categoryName: item.categoryName ? String(item.categoryName) : categoryName,
	};
}

// ============================================================================
// Chunking & Merging
// ============================================================================

/**
 * Split text into chunks by logical sections.
 * Exported for use by the API's menu extraction service.
 */
export function splitIntoChunks(text: string, maxSize: number): string[] {
	const chunks: string[] = [];
	const lines = text.split("\n");

	let currentChunk = "";
	for (const line of lines) {
		if (currentChunk.length + line.length > maxSize) {
			if (currentChunk) chunks.push(currentChunk);
			currentChunk = line;
		} else {
			currentChunk += (currentChunk ? "\n" : "") + line;
		}
	}
	if (currentChunk) chunks.push(currentChunk);

	return chunks;
}

/**
 * Merge multiple extractions into one.
 * Exported for use by the API's menu extraction service.
 */
export function mergeExtractions(extractions: AIMenuExtraction[]): AIMenuExtraction {
	const categoryMap = new Map<string, AIMenuExtraction["categories"][0]>();
	const optionGroupMap = new Map<string, AIMenuExtraction["optionGroups"][0]>();
	let totalConfidence = 0;

	for (const ext of extractions) {
		totalConfidence += ext.confidence;

		for (const cat of ext.categories) {
			const key = cat.name.toLowerCase();
			const existing = categoryMap.get(key);
			if (existing) {
				existing.items.push(...cat.items);
			} else {
				categoryMap.set(key, { ...cat });
			}
		}

		for (const og of ext.optionGroups) {
			const key = og.name.toLowerCase();
			const existing = optionGroupMap.get(key);
			if (existing) {
				existing.appliesTo = [
					...new Set([...existing.appliesTo, ...og.appliesTo]),
				];
			} else {
				optionGroupMap.set(key, { ...og });
			}
		}
	}

	return {
		categories: Array.from(categoryMap.values()),
		optionGroups: Array.from(optionGroupMap.values()),
		confidence: totalConfidence / extractions.length,
	};
}

/**
 * Basic blocklist for obviously offensive content.
 * This is a lightweight filter - expand as needed or use a library like 'bad-words' for comprehensive filtering.
 * Note: Using 'i' flag only (not 'g') since we only need to detect presence, not find all matches.
 * The 'g' flag causes lastIndex state issues when reusing patterns.
 */
const BLOCKED_CONTENT_PATTERNS = [
	// Slurs and hate speech patterns (keeping this minimal and generic)
	/\bn[i1]gg[ae3]r?s?\b/i,
	/\bf[a@]gg?[o0]t?s?\b/i,
	/\bk[i1]k[e3]s?\b/i,
	/\bch[i1]nks?\b/i,
	/\bsp[i1]cs?\b/i,
	/\bw[e3]tb[a@]cks?\b/i,
	// Explicit profanity
	/\bf+u+c+k+/i,
	/\bs+h+[i1]+t+/i,
	/\bc+u+n+t+/i,
	/\ba+s+s+h+o+l+e+/i,
];

/**
 * Check if text contains blocked content.
 * @internal Exported for testing
 */
export function containsBlockedContent(text: string | undefined): boolean {
	if (!text) return false;
	return BLOCKED_CONTENT_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Filter extracted menu data to remove offensive content.
 * Replaces offensive names/descriptions with placeholder text.
 * Exported for use by the API's menu extraction service.
 */
export function filterExtraction(extraction: AIMenuExtraction): AIMenuExtraction {
	return {
		...extraction,
		categories: extraction.categories.map((cat) => ({
			...cat,
			name: containsBlockedContent(cat.name) ? "[Filtered Category]" : cat.name,
			description:
				cat.description && containsBlockedContent(cat.description)
					? "[Filtered]"
					: cat.description,
			items: cat.items.map((item) => ({
				...item,
				name: containsBlockedContent(item.name) ? "[Filtered Item]" : item.name,
				description:
					item.description && containsBlockedContent(item.description)
						? "[Filtered]"
						: item.description,
				categoryName: containsBlockedContent(item.categoryName)
					? "[Filtered Category]"
					: item.categoryName,
			})),
		})),
		optionGroups: extraction.optionGroups.map((og) => ({
			...og,
			name: containsBlockedContent(og.name) ? "[Filtered Option]" : og.name,
			description:
				og.description && containsBlockedContent(og.description)
					? "[Filtered]"
					: og.description,
			choices: og.choices.map((choice) => ({
				...choice,
				name: containsBlockedContent(choice.name)
					? "[Filtered Choice]"
					: choice.name,
			})),
		})),
	};
}
