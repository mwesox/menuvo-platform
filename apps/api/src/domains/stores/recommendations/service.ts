/**
 * AI Recommendations Service
 *
 * Service facade for AI-powered product recommendations.
 */

import type { Database } from "@menuvo/db";
import type { EntityTranslations } from "@menuvo/db/schema";
import { items, storeSettings, stores } from "@menuvo/db/schema";
import { and, eq, inArray, not } from "drizzle-orm";
import { generateStructured } from "../../../infrastructure/ai/service";
import { ForbiddenError } from "../../errors";
import type { IRecommendationsService } from "./interface";
import { buildRecommendationPrompt, buildSystemPrompt } from "./prompts";
import type { GetRecommendationsInput, SaveAiSettingsInput } from "./schemas";
import { aiSuggestionSchema } from "./schemas";
import type {
	AiRecommendationsSettings,
	MenuItemContext,
	RecommendationsResponse,
} from "./types";
import { DEFAULT_AI_RECOMMENDATIONS } from "./types";

// AI model to use for recommendations
const AI_MODEL = "openai/gpt-4o-mini";

/**
 * AI recommendations service implementation
 */
export class RecommendationsService implements IRecommendationsService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getAiSettings(
		storeId: string,
		merchantId: string,
	): Promise<AiRecommendationsSettings> {
		// Verify store belongs to merchant
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.id, storeId),
			columns: { id: true, merchantId: true },
		});

		if (!store || store.merchantId !== merchantId) {
			throw new ForbiddenError("Store not found or access denied");
		}

		// Get or create settings row to ensure real timestamps
		let settings = await this.db.query.storeSettings.findFirst({
			where: eq(storeSettings.storeId, storeId),
		});

		if (!settings) {
			// Create default settings row on first access
			const [created] = await this.db
				.insert(storeSettings)
				.values({
					storeId,
					aiRecommendations: DEFAULT_AI_RECOMMENDATIONS,
				})
				.returning();

			if (!created) {
				throw new Error("Failed to create AI settings");
			}
			settings = created;
		}

		const aiConfig = settings.aiRecommendations ?? DEFAULT_AI_RECOMMENDATIONS;

		return {
			storeId,
			enabled: aiConfig.enabled,
			pairingRules: aiConfig.pairingRules,
			tone: aiConfig.tone,
			createdAt: settings.createdAt,
			updatedAt: settings.updatedAt,
		};
	}

	async saveAiSettings(
		input: SaveAiSettingsInput,
		merchantId: string,
	): Promise<AiRecommendationsSettings> {
		// Verify store belongs to merchant
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.id, input.storeId),
			columns: { id: true, merchantId: true },
		});

		if (!store || store.merchantId !== merchantId) {
			throw new ForbiddenError("Store not found or access denied");
		}

		const aiRecommendations = {
			enabled: input.enabled,
			pairingRules: input.pairingRules,
			tone: input.tone,
		};

		// Get current settings to preserve other fields
		const currentSettings = await this.db.query.storeSettings.findFirst({
			where: eq(storeSettings.storeId, input.storeId),
		});

		// Upsert settings
		const [upsertedSettings] = await this.db
			.insert(storeSettings)
			.values({
				storeId: input.storeId,
				aiRecommendations,
				orderTypes: currentSettings?.orderTypes ?? null,
			})
			.onConflictDoUpdate({
				target: storeSettings.storeId,
				set: {
					aiRecommendations,
					updatedAt: new Date(),
				},
			})
			.returning();

		if (!upsertedSettings) {
			throw new Error("Failed to save AI settings");
		}

		const savedConfig =
			upsertedSettings.aiRecommendations ?? DEFAULT_AI_RECOMMENDATIONS;

		return {
			storeId: upsertedSettings.storeId,
			enabled: savedConfig.enabled,
			pairingRules: savedConfig.pairingRules,
			tone: savedConfig.tone,
			createdAt: upsertedSettings.createdAt,
			updatedAt: upsertedSettings.updatedAt,
		};
	}

	async getRecommendations(
		input: GetRecommendationsInput,
	): Promise<RecommendationsResponse | null> {
		try {
			// Find store by slug
			const store = await this.db.query.stores.findFirst({
				where: eq(stores.slug, input.storeSlug),
				columns: {
					id: true,
					isActive: true,
					countryCode: true,
					timezone: true,
				},
				with: {
					settings: {
						columns: { aiRecommendations: true },
					},
				},
			});

			if (!store || !store.isActive) {
				return null;
			}

			// Check if AI recommendations are enabled
			const aiConfig =
				store.settings?.aiRecommendations ?? DEFAULT_AI_RECOMMENDATIONS;
			if (!aiConfig.enabled) {
				return null;
			}

			// Get cart items details
			const cartItems = await this.db.query.items.findMany({
				where: and(
					inArray(items.id, input.cartItemIds),
					eq(items.storeId, store.id),
					eq(items.isActive, true),
				),
				columns: {
					id: true,
					translations: true,
					price: true,
					categoryId: true,
				},
				with: {
					category: {
						columns: { translations: true },
					},
				},
			});

			if (cartItems.length === 0) {
				return null;
			}

			// Get available items (active items not in cart)
			const availableItems = await this.db.query.items.findMany({
				where: and(
					eq(items.storeId, store.id),
					eq(items.isActive, true),
					not(inArray(items.id, input.cartItemIds)),
				),
				columns: {
					id: true,
					translations: true,
					price: true,
					imageUrl: true,
					categoryId: true,
				},
				with: {
					category: {
						columns: { translations: true },
					},
				},
				limit: 50, // Limit to avoid huge context
			});

			if (availableItems.length === 0) {
				return null;
			}

			// Build context for AI
			const cartContext: MenuItemContext[] = cartItems.map((item) => ({
				id: item.id,
				name: this.extractTranslation(
					item.translations,
					input.languageCode,
					"name",
				),
				description: this.extractTranslation(
					item.translations,
					input.languageCode,
					"description",
				),
				price: item.price,
				categoryName: this.extractTranslation(
					item.category?.translations,
					input.languageCode,
					"name",
				),
			}));

			const availableContext: MenuItemContext[] = availableItems.map(
				(item) => ({
					id: item.id,
					name: this.extractTranslation(
						item.translations,
						input.languageCode,
						"name",
					),
					description: this.extractTranslation(
						item.translations,
						input.languageCode,
						"description",
					),
					price: item.price,
					categoryName: this.extractTranslation(
						item.category?.translations,
						input.languageCode,
						"name",
					),
				}),
			);

			// Get current hour in store's timezone for time-aware recommendations
			const currentHour = this.getStoreHour(store.timezone);
			const tone = aiConfig.tone;

			// Build prompts with tone and time context
			const systemPrompt = buildSystemPrompt(tone);
			const userPrompt = buildRecommendationPrompt({
				cartItems: cartContext,
				availableItems: availableContext,
				pairingRules: aiConfig.pairingRules,
				languageCode: input.languageCode,
				countryCode: store.countryCode,
				tone,
				currentHour,
			});

			// Call AI with timeout
			const aiResponse = await Promise.race([
				generateStructured({
					model: AI_MODEL,
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: userPrompt },
					],
					schema: aiSuggestionSchema,
					schemaName: "recommendation_suggestions",
				}),
				this.timeout(5000), // 5 second timeout
			]);

			if (!aiResponse || !("suggestions" in aiResponse)) {
				return null;
			}

			// Map AI response to full item details
			const suggestions: RecommendationsResponse["suggestions"] = [];
			const itemMap = new Map(availableItems.map((item) => [item.id, item]));

			for (const suggestion of aiResponse.suggestions) {
				const item = itemMap.get(suggestion.itemId);
				if (item) {
					suggestions.push({
						itemId: item.id,
						name: this.extractTranslation(
							item.translations,
							input.languageCode,
							"name",
						),
						price: item.price,
						imageUrl: item.imageUrl ?? null,
						reason: suggestion.reason,
					});
				}
			}

			return {
				sectionTitle: aiResponse.sectionTitle,
				suggestions: suggestions.slice(0, 3), // Ensure max 3
			};
		} catch (error) {
			// Graceful degradation - return null on any error
			console.error("AI recommendations error:", error);
			return null;
		}
	}

	/**
	 * Get current hour in store's timezone
	 */
	private getStoreHour(timezone: string): number {
		try {
			const now = new Date();
			const formatter = new Intl.DateTimeFormat("en-US", {
				timeZone: timezone,
				hour: "numeric",
				hour12: false,
			});
			return Number.parseInt(formatter.format(now), 10);
		} catch {
			// Fallback to UTC hour if timezone is invalid
			return new Date().getUTCHours();
		}
	}

	private extractTranslation(
		translations: EntityTranslations | null | undefined,
		languageCode: string,
		field: "name" | "description",
	): string {
		if (!translations) return field === "name" ? "Unknown" : "";

		// Try requested language first
		const langTranslation = translations[languageCode];
		if (langTranslation?.[field]) {
			return langTranslation[field] ?? "";
		}

		// Fall back to German (primary language)
		const deTranslation = translations.de;
		if (deTranslation?.[field]) {
			return deTranslation[field] ?? "";
		}

		// Fall back to first available
		const firstKey = Object.keys(translations)[0];
		if (firstKey) {
			const firstTranslation = translations[firstKey];
			return firstTranslation?.[field] ?? (field === "name" ? "Unknown" : "");
		}

		return field === "name" ? "Unknown" : "";
	}

	private timeout(ms: number): Promise<null> {
		return new Promise((resolve) => setTimeout(() => resolve(null), ms));
	}
}
