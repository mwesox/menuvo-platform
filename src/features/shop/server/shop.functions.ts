import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import {
	type ChoiceTranslations,
	categories,
	type DayOfWeek,
	type EntityTranslations,
	items,
	optionChoices,
	type StoreHour,
	stores,
} from "@/db/schema";
import { publicStoresFilterSchema, storeBySlugSchema } from "../validation";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Days of week mapping for JavaScript Date.getDay() (0 = Sunday, 6 = Saturday)
 * to our database enum values.
 */
const JS_DAY_TO_ENUM: Record<number, DayOfWeek> = {
	0: "sunday",
	1: "monday",
	2: "tuesday",
	3: "wednesday",
	4: "thursday",
	5: "friday",
	6: "saturday",
};

/**
 * Checks if a store is currently open based on its hours and timezone.
 * Considers the store's local time when making the determination.
 */
function isStoreOpen(
	hours: Pick<StoreHour, "dayOfWeek" | "openTime" | "closeTime">[],
	timezone: string,
): boolean {
	if (hours.length === 0) {
		return false;
	}

	// Get current time in store's timezone
	const now = new Date();
	const storeTime = new Date(
		now.toLocaleString("en-US", { timeZone: timezone }),
	);
	const currentDay = JS_DAY_TO_ENUM[storeTime.getDay()];
	const currentTime = `${storeTime.getHours().toString().padStart(2, "0")}:${storeTime.getMinutes().toString().padStart(2, "0")}`;

	// Find today's hours
	const todayHours = hours.filter((h) => h.dayOfWeek === currentDay);

	if (todayHours.length === 0) {
		return false;
	}

	// Check if current time falls within any of today's opening periods
	return todayHours.some((period) => {
		// Handle overnight hours (close time is smaller than open time)
		if (period.closeTime < period.openTime) {
			// For overnight, check if we're after open OR before close
			return currentTime >= period.openTime || currentTime < period.closeTime;
		}
		// Normal hours
		return currentTime >= period.openTime && currentTime < period.closeTime;
	});
}

/**
 * Checks if a store is currently closed due to a scheduled closure.
 */
function isStoreClosed(
	closures: { startDate: string; endDate: string }[],
	timezone: string,
): boolean {
	if (closures.length === 0) {
		return false;
	}

	// Get current date in store's timezone
	const now = new Date();
	const storeDate = new Date(
		now.toLocaleString("en-US", { timeZone: timezone }),
	);
	const currentDate = storeDate.toISOString().split("T")[0];

	return closures.some(
		(closure) =>
			currentDate >= closure.startDate && currentDate <= closure.endDate,
	);
}

/**
 * Get localized content from translations with fallback chain.
 * Inlined here to avoid import issues with server functions.
 */
function getLocalizedContent(
	translations: EntityTranslations | null | undefined,
	requestedLang: string,
	fallbackLang: string,
): { name: string; description: string | null } {
	if (!translations || Object.keys(translations).length === 0) {
		return { name: "", description: null };
	}

	// 1. Try requested language
	if (translations[requestedLang]?.name) {
		return {
			name: translations[requestedLang].name ?? "",
			description: translations[requestedLang].description ?? null,
		};
	}

	// 2. Fallback to first supported language
	if (translations[fallbackLang]?.name) {
		return {
			name: translations[fallbackLang].name ?? "",
			description: translations[fallbackLang].description ?? null,
		};
	}

	// 3. Fallback to first available
	for (const lang of Object.keys(translations)) {
		if (translations[lang]?.name) {
			return {
				name: translations[lang].name ?? "",
				description: translations[lang].description ?? null,
			};
		}
	}

	return { name: "", description: null };
}

/**
 * Get localized name from choice translations with fallback chain.
 */
function getLocalizedChoiceName(
	translations: ChoiceTranslations | null | undefined,
	requestedLang: string,
	fallbackLang: string,
): string {
	if (!translations || Object.keys(translations).length === 0) {
		return "";
	}

	// 1. Try requested language
	if (translations[requestedLang]?.name) {
		return translations[requestedLang].name ?? "";
	}

	// 2. Fallback to first supported language
	if (translations[fallbackLang]?.name) {
		return translations[fallbackLang].name ?? "";
	}

	// 3. Fallback to first available
	for (const lang of Object.keys(translations)) {
		if (translations[lang]?.name) {
			return translations[lang].name ?? "";
		}
	}

	return "";
}

// ============================================================================
// SERVER FUNCTIONS
// ============================================================================

/**
 * Get all active stores for the public discovery page.
 * Returns stores with their current open/closed status.
 */
export const getPublicStores = createServerFn({ method: "GET" })
	.inputValidator(publicStoresFilterSchema)
	.handler(async ({ data }) => {
		try {
			// Build where conditions
			const conditions = [eq(stores.isActive, true)];

			if (data?.city) {
				conditions.push(ilike(stores.city, `%${data.city}%`));
			}

			if (data?.search) {
				conditions.push(
					or(
						ilike(stores.name, `%${data.search}%`),
						ilike(stores.city, `%${data.search}%`),
					) ?? eq(stores.id, -1), // Fallback that never matches
				);
			}

			// Fetch stores with hours and closures
			const allStores = await db.query.stores.findMany({
				where: and(...conditions),
				orderBy: (s, { asc }) => [asc(s.name)],
				with: {
					hours: {
						columns: {
							dayOfWeek: true,
							openTime: true,
							closeTime: true,
						},
					},
					closures: {
						columns: {
							startDate: true,
							endDate: true,
						},
					},
				},
			});

			// Calculate isOpen status for each store
			return allStores.map((store) => {
				const { hours, closures, ...storeData } = store;
				const hasClosure = isStoreClosed(closures, store.timezone);
				const isOpen = !hasClosure && isStoreOpen(hours, store.timezone);

				return {
					...storeData,
					imageUrl: store.logoUrl, // Map logoUrl to imageUrl for store cards
					isOpen,
				};
			});
		} catch {
			// Return empty array if database is not available or tables don't exist
			return [];
		}
	});

/**
 * Get a store by its slug with full menu data for the customer-facing shop.
 * Returns nested categories with items and their option groups.
 * All names/descriptions are extracted from translations using the store's default language.
 */
export const getStoreBySlug = createServerFn({ method: "GET" })
	.inputValidator(storeBySlugSchema)
	.handler(async ({ data }) => {
		// Fetch store with all related data including merchant for language settings
		const store = await db.query.stores.findFirst({
			where: and(eq(stores.slug, data.slug), eq(stores.isActive, true)),
			with: {
				merchant: {
					columns: {
						supportedLanguages: true,
					},
				},
				hours: {
					columns: {
						id: true,
						dayOfWeek: true,
						openTime: true,
						closeTime: true,
						displayOrder: true,
					},
					orderBy: (h, { asc }) => [asc(h.displayOrder)],
				},
				closures: {
					columns: {
						startDate: true,
						endDate: true,
						reason: true,
					},
				},
				categories: {
					where: eq(categories.isActive, true),
					orderBy: (c, { asc }) => [asc(c.displayOrder)],
					with: {
						items: {
							where: eq(items.isAvailable, true),
							orderBy: (i, { asc }) => [asc(i.displayOrder)],
							with: {
								itemOptionGroups: {
									orderBy: (iog, { asc }) => [asc(iog.displayOrder)],
									with: {
										optionGroup: {
											with: {
												optionChoices: {
													where: eq(optionChoices.isAvailable, true),
													orderBy: (oc, { asc }) => [asc(oc.displayOrder)],
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		});

		if (!store) {
			throw notFound();
		}

		const {
			hours,
			closures,
			categories: storeCategories,
			merchant,
			...storeData
		} = store;

		// Get the default language for translations (first supported language)
		const supportedLanguages = merchant?.supportedLanguages ?? ["de"];
		const defaultLang = supportedLanguages[0] ?? "de";

		// Calculate open status
		const hasClosure = isStoreClosed(closures, store.timezone);
		const isOpen = !hasClosure && isStoreOpen(hours, store.timezone);

		// Find current/upcoming closure if any
		const now = new Date();
		const storeDate = new Date(
			now.toLocaleString("en-US", { timeZone: store.timezone }),
		);
		const currentDate = storeDate.toISOString().split("T")[0];

		const currentClosure = closures.find(
			(c) => currentDate >= c.startDate && currentDate <= c.endDate,
		);

		// Transform categories and items with localized content
		const categoriesWithItems = storeCategories.map((category) => {
			const categoryContent = getLocalizedContent(
				category.translations,
				defaultLang,
				defaultLang,
			);

			return {
				id: category.id,
				name: categoryContent.name,
				description: categoryContent.description,
				displayOrder: category.displayOrder,
				items: category.items.map((item) => {
					const itemContent = getLocalizedContent(
						item.translations,
						defaultLang,
						defaultLang,
					);

					return {
						id: item.id,
						name: itemContent.name,
						description: itemContent.description,
						price: item.price,
						imageUrl: item.imageUrl,
						allergens: item.allergens,
						displayOrder: item.displayOrder,
						optionGroups: item.itemOptionGroups
							.map((iog) => iog.optionGroup)
							.filter((og) => og.isActive)
							.map((og) => {
								const ogContent = getLocalizedContent(
									og.translations,
									defaultLang,
									defaultLang,
								);

								return {
									id: og.id,
									name: ogContent.name,
									description: ogContent.description,
									type: og.type,
									isRequired: og.isRequired,
									minSelections: og.minSelections,
									maxSelections: og.maxSelections,
									numFreeOptions: og.numFreeOptions,
									aggregateMinQuantity: og.aggregateMinQuantity,
									aggregateMaxQuantity: og.aggregateMaxQuantity,
									displayOrder: og.displayOrder,
									choices: og.optionChoices.map((choice) => ({
										id: choice.id,
										name: getLocalizedChoiceName(
											choice.translations,
											defaultLang,
											defaultLang,
										),
										priceModifier: choice.priceModifier,
										displayOrder: choice.displayOrder,
										isDefault: choice.isDefault,
										isAvailable: choice.isAvailable,
										minQuantity: choice.minQuantity,
										maxQuantity: choice.maxQuantity,
									})),
								};
							}),
					};
				}),
			};
		});

		return {
			...storeData,
			isOpen,
			currentClosure: currentClosure
				? {
						startDate: currentClosure.startDate,
						endDate: currentClosure.endDate,
						reason: currentClosure.reason,
					}
				: null,
			hours,
			categories: categoriesWithItems,
		};
	});
