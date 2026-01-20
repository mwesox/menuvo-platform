/**
 * AI Recommendations Schemas
 *
 * Zod schemas for AI recommendations procedures and domain types.
 * All domain types are defined as Zod schemas with inferred TypeScript types.
 */

import { z } from "zod";

// ============================================================================
// Enums
// ============================================================================

/**
 * Recommendation tone options
 */
export const recommendationTones = [
	"professional",
	"friendly",
	"playful",
] as const;

export const recommendationToneSchema = z.enum(recommendationTones);
export type RecommendationTone = z.infer<typeof recommendationToneSchema>;

// ============================================================================
// API Input Schemas
// ============================================================================

/**
 * Get AI settings - API schema (console)
 */
export const getAiSettingsSchema = z.object({
	storeId: z.string().uuid(),
});

export type GetAiSettingsInput = z.infer<typeof getAiSettingsSchema>;

/**
 * Save AI settings - API schema (console)
 */
export const saveAiSettingsSchema = z.object({
	storeId: z.string().uuid(),
	enabled: z.boolean(),
	pairingRules: z.array(z.string().min(1).max(200)).max(20),
	tone: recommendationToneSchema,
});

export type SaveAiSettingsInput = z.infer<typeof saveAiSettingsSchema>;

/**
 * Get recommendations - API schema (shop, public)
 */
export const getRecommendationsSchema = z.object({
	storeSlug: z.string().min(1),
	cartItemIds: z.array(z.string().uuid()).min(1),
	languageCode: z.string().length(2),
});

export type GetRecommendationsInput = z.infer<typeof getRecommendationsSchema>;

// ============================================================================
// Domain Types (Zod schemas)
// ============================================================================

/**
 * Full AI recommendations settings for console (includes storeId and timestamps)
 */
export const aiRecommendationsSettingsSchema = z.object({
	storeId: z.string().uuid(),
	enabled: z.boolean(),
	pairingRules: z.array(z.string()),
	tone: recommendationToneSchema,
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type AiRecommendationsSettings = z.infer<
	typeof aiRecommendationsSettingsSchema
>;

/**
 * Menu item data needed for AI recommendation context
 */
export const menuItemContextSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	price: z.number().int(),
	categoryName: z.string(),
});

export type MenuItemContext = z.infer<typeof menuItemContextSchema>;

/**
 * A single recommendation suggestion from the AI
 */
export const recommendationSuggestionSchema = z.object({
	itemId: z.string(),
	name: z.string(),
	price: z.number().int(),
	imageUrl: z.string().nullable(),
	reason: z.string(),
});

export type RecommendationSuggestion = z.infer<
	typeof recommendationSuggestionSchema
>;

/**
 * Full recommendations response including section title and suggestions
 */
export const recommendationsResponseSchema = z.object({
	sectionTitle: z.string(),
	suggestions: z.array(recommendationSuggestionSchema),
});

export type RecommendationsResponse = z.infer<
	typeof recommendationsResponseSchema
>;

// ============================================================================
// AI Structured Output Schema
// ============================================================================

/**
 * AI response schema - used for structured output from AI model
 */
export const aiSuggestionSchema = z.object({
	sectionTitle: z.string().max(60),
	suggestions: z
		.array(
			z.object({
				itemId: z.string(),
				reason: z.string().max(80),
			}),
		)
		.max(3),
});

export type AiSuggestionResponse = z.infer<typeof aiSuggestionSchema>;
