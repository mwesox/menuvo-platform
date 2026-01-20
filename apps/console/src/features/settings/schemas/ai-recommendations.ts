import { z } from "zod/v4";

/**
 * Recommendation tone options - must match API schema
 */
export const recommendationTones = [
	"professional",
	"friendly",
	"playful",
] as const;

/**
 * Validation constants - shared with API
 */
export const AI_RECOMMENDATIONS_LIMITS = {
	MAX_RULES: 20,
	MAX_RULE_LENGTH: 200,
} as const;

/**
 * AI Recommendations form schema
 */
export const aiRecommendationsFormSchema = z.object({
	enabled: z.boolean(),
	pairingRules: z
		.array(z.string().max(AI_RECOMMENDATIONS_LIMITS.MAX_RULE_LENGTH))
		.max(AI_RECOMMENDATIONS_LIMITS.MAX_RULES),
	tone: z.enum(recommendationTones),
});

export type AiRecommendationsFormInput = z.infer<
	typeof aiRecommendationsFormSchema
>;
