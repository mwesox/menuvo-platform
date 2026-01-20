/**
 * AI Recommendations Domain
 *
 * AI-powered cross-sell/upsell recommendations at checkout.
 */

export type { IRecommendationsService } from "./interface";
export type { RecommendationsRouter } from "./router";
export { recommendationsRouter } from "./router";
export * from "./schemas";
export { RecommendationsService } from "./service";
export * from "./types";
