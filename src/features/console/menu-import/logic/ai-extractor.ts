import { chat, generateStructured } from "@/lib/ai/service";
import type { ExtractedMenuData } from "../types";
import { type AIMenuExtraction, aiMenuExtractionSchema } from "../validation";

const CHUNK_SIZE_CHARS = 50000;

/**
 * Model configuration defining capabilities and settings.
 */
export interface ModelConfig {
	/** OpenRouter model ID */
	id: string;
	/** Whether model supports JSON schema structured output */
	supportsStructuredOutput: boolean;
}

const SYSTEM_PROMPT = `You are a menu extraction specialist. Extract menu data and return ONLY valid JSON.

CRITICAL: Your response must be a JSON object with this EXACT structure:
{
  "categories": [
    {
      "name": "Category Name",
      "description": "optional description",
      "items": [
        {
          "name": "Item Name",
          "description": "optional description",
          "price": 999,
          "allergens": ["gluten", "dairy"],
          "categoryName": "Category Name"
        }
      ]
    }
  ],
  "optionGroups": [],
  "confidence": 0.9
}

RULES:
1. Prices in CENTS (e.g., $9.99 = 999)
2. If no price found, use 0
3. categoryName in each item MUST match its parent category name
4. confidence: 0.0-1.0 based on data quality
5. Return ONLY the JSON, no explanations or markdown`;

/**
 * Build the user prompt for menu extraction.
 */
function buildExtractionPrompt(
	menuText: string,
	existingContext?: { categories: string[]; items: string[] },
): string {
	let prompt = `Extract menu data from:\n\n${menuText}\n\n`;

	if (existingContext) {
		prompt += `\nEXISTING CONTEXT (use similar names if matches exist):\n`;
		if (existingContext.categories.length > 0) {
			prompt += `Categories: ${existingContext.categories.join(", ")}\n`;
		}
		if (existingContext.items.length > 0) {
			prompt += `Items: ${existingContext.items.slice(0, 30).join(", ")}\n`;
		}
	}

	prompt += `\nReturn the JSON object with categories, optionGroups, and confidence.`;

	return prompt;
}

/**
 * Parse AI response, handling various formats free models might return.
 */
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
 * Normalize a category object.
 */
function normalizeCategory(
	cat: Record<string, unknown>,
): AIMenuExtraction["categories"][0] {
	const name = String(cat.name || "Unknown Category");
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
		name: String(item.name || "Unknown Item"),
		description: item.description ? String(item.description) : undefined,
		price: typeof item.price === "number" ? item.price : 0,
		allergens: Array.isArray(item.allergens)
			? item.allergens.map(String)
			: undefined,
		categoryName: item.categoryName ? String(item.categoryName) : categoryName,
	};
}

/**
 * Split text into chunks by logical sections.
 */
function splitIntoChunks(text: string, maxSize: number): string[] {
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
 */
function mergeExtractions(extractions: AIMenuExtraction[]): AIMenuExtraction {
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

export interface ExtractionOptions {
	/** Model configuration */
	model: ModelConfig;
	existingCategories?: string[];
	existingItems?: string[];
}

/**
 * Extract using structured output (for capable models).
 */
async function extractWithStructuredOutput(
	prompt: string,
	model: string,
): Promise<AIMenuExtraction> {
	return generateStructured({
		model,
		messages: [
			{ role: "system", content: SYSTEM_PROMPT },
			{ role: "user", content: prompt },
		],
		schema: aiMenuExtractionSchema,
		schemaName: "MenuExtraction",
	});
}

/**
 * Extract using chat + parse (for free/basic models).
 */
async function extractWithChat(
	prompt: string,
	model: string,
): Promise<AIMenuExtraction> {
	const content = await chat({
		model,
		messages: [
			{ role: "system", content: SYSTEM_PROMPT },
			{ role: "user", content: prompt },
		],
	});
	console.log("  AI raw response:", content.slice(0, 300), "...");
	return parseAIResponse(content);
}

/**
 * Extract menu data from text using AI.
 */
export async function extractMenuFromText(
	text: string,
	options: ExtractionOptions,
): Promise<ExtractedMenuData> {
	const { model } = options;
	const existingContext =
		options.existingCategories || options.existingItems
			? {
					categories: options.existingCategories || [],
					items: options.existingItems || [],
				}
			: undefined;

	// Use extraction method based on model capabilities
	const extractFn = model.supportsStructuredOutput
		? extractWithStructuredOutput
		: extractWithChat;
	const methodName = model.supportsStructuredOutput ? "structured" : "chat";
	console.log(`  Using ${methodName} extraction for ${model.id}`);

	let extraction: AIMenuExtraction;

	// Check if text needs chunking
	if (text.length > CHUNK_SIZE_CHARS) {
		const chunks = splitIntoChunks(text, CHUNK_SIZE_CHARS);
		const extractions: AIMenuExtraction[] = [];

		for (const chunk of chunks) {
			const prompt = buildExtractionPrompt(chunk, existingContext);
			extractions.push(await extractFn(prompt, model.id));
		}

		extraction = mergeExtractions(extractions);
	} else {
		const prompt = buildExtractionPrompt(text, existingContext);
		extraction = await extractFn(prompt, model.id);
	}

	// Transform to our internal type
	return {
		categories: extraction.categories.map((cat) => ({
			name: cat.name,
			description: cat.description,
			items: cat.items.map((item) => ({
				name: item.name,
				description: item.description,
				price: item.price,
				allergens: item.allergens,
				categoryName: cat.name,
			})),
		})),
		optionGroups: extraction.optionGroups.map((og) => ({
			name: og.name,
			description: og.description,
			type: og.type,
			isRequired: og.isRequired,
			choices: og.choices,
			appliesTo: og.appliesTo,
		})),
		confidence: extraction.confidence,
	};
}
