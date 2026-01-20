/**
 * AI Recommendation Prompts
 *
 * Prompt templates for AI-powered product recommendations with
 * dynamic titles and tone-awareness.
 */

import type { MenuItemContext, RecommendationTone } from "./types";

/**
 * Tone descriptions for prompt context
 */
const TONE_DESCRIPTIONS: Record<RecommendationTone, string> = {
	professional: `Professional/Elegant tone:
- Use formal language (Sie-form in German, polite phrasing in English)
- Clear, refined wording suitable for fine dining
- Examples: "Recommended with your order", "Chef's pairing suggestion", "Pairs beautifully with your selection"`,

	friendly: `Friendly/Warm tone:
- Use warm, inviting language (Du-form OK in German, casual-friendly in English)
- Conversational and approachable
- Examples: "This goes great with your order!", "Our guests love this combo!", "The perfect addition!"`,

	playful: `Playful/Fun tone:
- Use casual, fun language with personality
- Can reference items directly in creative ways
- Examples: "Your pizza wants company!", "Don't forget the drinks!", "Your Schnitzel's best friend!"`,
};

/**
 * Get time-of-day context for better recommendations
 */
function getTimeContext(hour: number): string {
	if (hour >= 6 && hour < 11) {
		return "Time: Morning/Breakfast time - consider morning beverages (coffee, tea, juice)";
	}
	if (hour >= 11 && hour < 14) {
		return "Time: Lunch time - consider lunch drinks and quick sides";
	}
	if (hour >= 14 && hour < 17) {
		return "Time: Afternoon - consider snacks, coffee, desserts";
	}
	if (hour >= 17 && hour < 21) {
		return "Time: Dinner time - consider dinner wines, appetizers, full meal additions";
	}
	return "Time: Late night - consider drinks and light snacks";
}

/**
 * Analyze cart composition and provide hints
 */
function analyzeCart(cartItems: MenuItemContext[]): string {
	const categories = cartItems.map((item) => item.categoryName.toLowerCase());

	const hints: string[] = [];

	// Check for common patterns
	const hasDrink = categories.some(
		(c) =>
			c.includes("drink") ||
			c.includes("getränk") ||
			c.includes("beverage") ||
			c.includes("cola") ||
			c.includes("water"),
	);
	const hasMain = categories.some(
		(c) =>
			c.includes("main") ||
			c.includes("haupt") ||
			c.includes("pizza") ||
			c.includes("burger") ||
			c.includes("pasta") ||
			c.includes("gericht"),
	);
	const hasDessert = categories.some(
		(c) =>
			c.includes("dessert") ||
			c.includes("nachtisch") ||
			c.includes("sweet") ||
			c.includes("cake"),
	);
	const hasSide = categories.some(
		(c) =>
			c.includes("side") ||
			c.includes("beilage") ||
			c.includes("salad") ||
			c.includes("fries"),
	);

	if (!hasDrink && hasMain) {
		hints.push("Cart has food but no drink - prioritize beverage suggestions");
	}
	if (hasMain && !hasSide) {
		hints.push("Cart has main course but no side - consider sides");
	}
	if (hasMain && !hasDessert) {
		hints.push("No dessert in cart - could suggest dessert");
	}

	return hints.length > 0
		? `Cart analysis:\n${hints.map((h) => `- ${h}`).join("\n")}`
		: "";
}

/**
 * System prompt for the recommendation AI
 */
export function buildSystemPrompt(tone: RecommendationTone): string {
	return `You are a restaurant ordering assistant helping customers discover complementary items.

Your task is to:
1. Generate a dynamic section TITLE (max 60 chars) that references specific items in the cart
2. Suggest 0-3 complementary items with engaging reasons

${TONE_DESCRIPTIONS[tone]}

TITLE Rules:
- Must be in the customer's language
- Should reference specific cart items when possible (e.g., "Your Margherita wants company!")
- Match the requested tone
- Max 60 characters
- Be creative and engaging, not generic

SUGGESTION Rules:
- Suggest 0-3 items maximum
- Never suggest items already in the cart
- Each reason: max 80 characters, in customer's language, matching the tone
- Return empty suggestions array if no good complementary items exist
- Focus on enhancing the dining experience, not upselling expensive items
- Consider meal composition (drinks with food, sides with mains, desserts after meals)
- Consider cultural food pairing conventions`;
}

/**
 * Build the user prompt for recommendations
 */
export function buildRecommendationPrompt(params: {
	cartItems: MenuItemContext[];
	availableItems: MenuItemContext[];
	pairingRules: string[];
	languageCode: string;
	countryCode: string;
	tone: RecommendationTone;
	currentHour: number;
}): string {
	const {
		cartItems,
		availableItems,
		pairingRules,
		languageCode,
		countryCode,
		tone,
		currentHour,
	} = params;

	const cartItemsList = cartItems
		.map((item) => `- ${item.name} (${item.categoryName})`)
		.join("\n");

	const availableItemsList = availableItems
		.map(
			(item) =>
				`- ID: ${item.id}, Name: ${item.name}, Category: ${item.categoryName}, Price: €${(item.price / 100).toFixed(2)}`,
		)
		.join("\n");

	// Get contextual hints
	const timeContext = getTimeContext(currentHour);
	const cartAnalysis = analyzeCart(cartItems);

	let prompt = `Customer's current cart:
${cartItemsList}

Available items to suggest from:
${availableItemsList}

Customer's language: ${languageCode}
Country: ${countryCode}
Tone: ${tone}

${timeContext}
${cartAnalysis}`;

	if (pairingRules.length > 0) {
		const rulesFormatted = pairingRules.map((rule) => `- ${rule}`).join("\n");
		prompt += `

Merchant's pairing rules (follow these when applicable):
${rulesFormatted}`;
	}

	prompt += `

Generate:
1. A creative section title (max 60 chars) in ${languageCode} that references the cart items
2. 0-3 complementary item suggestions with engaging reasons in ${languageCode}

Remember: Match the ${tone} tone in both title and reasons.`;

	return prompt;
}
