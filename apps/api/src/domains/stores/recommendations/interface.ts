/**
 * AI Recommendations Service Interface
 *
 * Defines the contract for AI recommendation operations.
 */

import type { GetRecommendationsInput, SaveAiSettingsInput } from "./schemas";
import type {
	AiRecommendationsSettings,
	RecommendationsResponse,
} from "./types";

/**
 * AI recommendations service interface
 */
export interface IRecommendationsService {
	/**
	 * Get AI settings for a store (console use)
	 * Requires merchant ownership verification
	 */
	getAiSettings(
		storeId: string,
		merchantId: string,
	): Promise<AiRecommendationsSettings>;

	/**
	 * Save AI settings for a store
	 * Requires merchant ownership verification
	 */
	saveAiSettings(
		input: SaveAiSettingsInput,
		merchantId: string,
	): Promise<AiRecommendationsSettings>;

	/**
	 * Get AI-powered recommendations for checkout (shop use, public)
	 * Returns null on failure (graceful degradation)
	 */
	getRecommendations(
		input: GetRecommendationsInput,
	): Promise<RecommendationsResponse | null>;
}
