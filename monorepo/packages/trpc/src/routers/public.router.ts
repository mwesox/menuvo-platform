/**
 * Public Router
 *
 * Handles public-facing procedures that don't require authentication:
 * - Menu viewing
 * - Store discovery
 * - Health checks
 */

import {
	type ChoiceTranslations,
	categories,
	type EntityTranslations,
	itemOptionGroups,
	items,
	optionChoices,
	stores,
} from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, gt, ilike, or } from "drizzle-orm";
import { z } from "zod";
import {
	getFeaturedStoresSchema,
	getItemDetailsSchema,
	getMenuSchema,
	searchStoresSchema,
} from "../schemas/public.schema.js";
import { publicProcedure, router } from "../trpc.js";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract translated name from translations JSONB
 * Falls back to first available language if requested language not found
 */
function getTranslatedName(
	translations: EntityTranslations | ChoiceTranslations | null,
	languageCode: string,
): string {
	if (!translations) return "";

	// Try requested language first
	const translation = translations[languageCode];
	if (translation?.name) return translation.name;

	// Fall back to first available translation
	const firstLang = Object.keys(translations)[0];
	if (firstLang && translations[firstLang]?.name) {
		return translations[firstLang].name;
	}

	return "";
}

/**
 * Extract translated description from translations JSONB
 */
function getTranslatedDescription(
	translations: EntityTranslations | null,
	languageCode: string,
): string | null {
	if (!translations) return null;

	// Try requested language first
	const translation = translations[languageCode];
	if (translation?.description !== undefined)
		return translation.description ?? null;

	// Fall back to first available translation
	const firstLang = Object.keys(translations)[0];
	if (firstLang && translations[firstLang]?.description !== undefined) {
		return translations[firstLang].description ?? null;
	}

	return null;
}

// ============================================================================
// PUBLIC ROUTER
// ============================================================================

export const publicRouter = router({
	/**
	 * Health check endpoint
	 */
	health: publicProcedure.query(() => {
		return {
			status: "ok",
			timestamp: new Date().toISOString(),
		};
	}),

	/**
	 * Get full menu for a store
	 * Returns store info, categories, and items in a single query
	 */
	getMenu: publicProcedure
		.input(getMenuSchema)
		.query(async ({ ctx, input }) => {
			const { storeSlug, languageCode } = input;

			// Fetch store with categories and items using Drizzle relations
			const store = await ctx.db.query.stores.findFirst({
				where: and(eq(stores.slug, storeSlug), eq(stores.isActive, true)),
				with: {
					categories: {
						where: eq(categories.isActive, true),
						orderBy: [asc(categories.displayOrder)],
						with: {
							items: {
								where: eq(items.isAvailable, true),
								orderBy: [asc(items.displayOrder)],
								with: {
									optGroups: true, // Include to determine hasOptionGroups
								},
							},
						},
					},
				},
			});

			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found",
				});
			}

			// Transform to public format with translations applied
			return {
				store: {
					id: store.id,
					slug: store.slug,
					name: store.name,
					logoUrl: store.logoUrl,
					street: store.street,
					city: store.city,
					postalCode: store.postalCode,
					country: store.country,
					currency: store.currency,
				},
				categories: store.categories.map((category) => ({
					id: category.id,
					name: getTranslatedName(category.translations, languageCode),
					description: getTranslatedDescription(
						category.translations,
						languageCode,
					),
					displayOrder: category.displayOrder,
					items: category.items.map((item) => ({
						id: item.id,
						categoryId: item.categoryId,
						name: getTranslatedName(item.translations, languageCode),
						kitchenName: item.kitchenName,
						description: getTranslatedDescription(
							item.translations,
							languageCode,
						),
						price: item.price,
						imageUrl: item.imageUrl,
						allergens: item.allergens,
						displayOrder: item.displayOrder,
						hasOptionGroups: item.optGroups.length > 0,
					})),
				})),
			};
		}),

	/**
	 * Search stores by name, city, or location
	 */
	searchStores: publicProcedure
		.input(searchStoresSchema)
		.query(async ({ ctx, input }) => {
			const { query, city, limit, cursor } = input;
			// Note: lat, lng, radius are accepted but geo-search requires PostGIS
			// For now, we filter by city/query only

			// Build where conditions
			const conditions = [eq(stores.isActive, true)];

			// Text search on name
			if (query) {
				conditions.push(
					or(
						ilike(stores.name, `%${query}%`),
						ilike(stores.city, `%${query}%`),
					) ?? eq(stores.isActive, true),
				);
			}

			// City filter
			if (city) {
				conditions.push(ilike(stores.city, `%${city}%`));
			}

			// Cursor-based pagination
			if (cursor) {
				conditions.push(gt(stores.id, cursor));
			}

			const results = await ctx.db.query.stores.findMany({
				where: and(...conditions),
				orderBy: [asc(stores.name)],
				limit: limit + 1, // Fetch one extra to check if there are more
				columns: {
					id: true,
					slug: true,
					name: true,
					logoUrl: true,
					street: true,
					city: true,
					postalCode: true,
					country: true,
					currency: true,
				},
			});

			// Check if there are more results
			const hasMore = results.length > limit;
			const storeResults = hasMore ? results.slice(0, -1) : results;
			const nextCursor = hasMore
				? storeResults[storeResults.length - 1]?.id
				: undefined;

			return {
				stores: storeResults,
				nextCursor,
			};
		}),

	/**
	 * Get featured stores for homepage/discovery
	 * Currently returns active stores; can be extended with featured flag
	 */
	getFeaturedStores: publicProcedure
		.input(getFeaturedStoresSchema)
		.query(async ({ ctx, input }) => {
			const { city, limit } = input;

			// Build where conditions
			const conditions = [eq(stores.isActive, true)];

			// City filter
			if (city) {
				conditions.push(ilike(stores.city, `%${city}%`));
			}

			// TODO: Add isFeatured column to stores table for explicit featuring
			// For now, return active stores ordered by creation date (newest first)
			const results = await ctx.db.query.stores.findMany({
				where: and(...conditions),
				orderBy: (stores, { desc }) => [desc(stores.createdAt)],
				limit,
				columns: {
					id: true,
					slug: true,
					name: true,
					logoUrl: true,
					street: true,
					city: true,
					postalCode: true,
					country: true,
					currency: true,
				},
			});

			return results;
		}),

	/**
	 * Get detailed item information including option groups
	 * Used for item detail pages, SEO, and sharing
	 */
	getItemDetails: publicProcedure
		.input(getItemDetailsSchema)
		.query(async ({ ctx, input }) => {
			const { itemId, languageCode } = input;

			// Fetch item with store verification
			const item = await ctx.db.query.items.findFirst({
				where: and(eq(items.id, itemId), eq(items.isAvailable, true)),
				with: {
					store: {
						columns: {
							id: true,
							slug: true,
							name: true,
							isActive: true,
							currency: true,
						},
					},
					category: {
						columns: {
							id: true,
							isActive: true,
						},
					},
				},
			});

			if (!item || !item.store.isActive || !item.category.isActive) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Item not found",
				});
			}

			// Fetch option groups linked to this item
			const itemOptGroups = await ctx.db.query.itemOptionGroups.findMany({
				where: eq(itemOptionGroups.itemId, itemId),
				orderBy: [asc(itemOptionGroups.displayOrder)],
				with: {
					optGroup: {
						with: {
							choices: {
								where: eq(optionChoices.isAvailable, true),
								orderBy: [asc(optionChoices.displayOrder)],
							},
						},
					},
				},
			});

			// Filter to only active option groups and transform
			const optionGroupsWithChoices = itemOptGroups
				.filter((iog) => iog.optGroup.isActive)
				.map((iog) => ({
					id: iog.optGroup.id,
					name: getTranslatedName(iog.optGroup.translations, languageCode),
					description: getTranslatedDescription(
						iog.optGroup.translations,
						languageCode,
					),
					type: iog.optGroup.type,
					isRequired: iog.optGroup.isRequired,
					minSelections: iog.optGroup.minSelections,
					maxSelections: iog.optGroup.maxSelections,
					numFreeOptions: iog.optGroup.numFreeOptions,
					aggregateMinQuantity: iog.optGroup.aggregateMinQuantity,
					aggregateMaxQuantity: iog.optGroup.aggregateMaxQuantity,
					displayOrder: iog.displayOrder,
					choices: iog.optGroup.choices.map((choice) => ({
						id: choice.id,
						name: getTranslatedName(choice.translations, languageCode),
						priceModifier: choice.priceModifier,
						isDefault: choice.isDefault,
						isAvailable: choice.isAvailable,
						minQuantity: choice.minQuantity,
						maxQuantity: choice.maxQuantity,
						displayOrder: choice.displayOrder,
					})),
				}));

			return {
				id: item.id,
				categoryId: item.categoryId,
				name: getTranslatedName(item.translations, languageCode),
				description: getTranslatedDescription(item.translations, languageCode),
				price: item.price,
				imageUrl: item.imageUrl,
				allergens: item.allergens,
				displayOrder: item.displayOrder,
				optionGroups: optionGroupsWithChoices,
				store: {
					id: item.store.id,
					slug: item.store.slug,
					name: item.store.name,
					currency: item.store.currency,
				},
			};
		}),

	/**
	 * Resolve QR code short code to store/service point
	 * TODO: Implement actual QR code resolution when service points are set up
	 */
	resolveQRCode: publicProcedure
		.input(z.object({ shortCode: z.string() }))
		.query(async ({ input: _input }) => {
			// TODO: Look up QR code in database using _input.shortCode
			// For now, return not_found
			return {
				status: "not_found" as const,
				storeSlug: null as string | null,
				servicePointCode: null as string | null,
			};
		}),
});
