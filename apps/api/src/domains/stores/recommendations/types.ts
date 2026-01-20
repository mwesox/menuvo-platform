/**
 * AI Recommendations Domain Types
 *
 * Re-exports types from schemas.ts and defines constants.
 * All domain types are defined as Zod schemas in schemas.ts.
 */

import type { AiRecommendationsConfig } from "@menuvo/db/schema";

// Re-export all types from schemas for convenience
export type {
	AiRecommendationsSettings,
	MenuItemContext,
	RecommendationSuggestion,
	RecommendationsResponse,
	RecommendationTone,
} from "./schemas";

/**
 * Default AI recommendations configuration (disabled by default)
 */
export const DEFAULT_AI_RECOMMENDATIONS: AiRecommendationsConfig = {
	enabled: false,
	pairingRules: [],
	tone: "friendly",
};
