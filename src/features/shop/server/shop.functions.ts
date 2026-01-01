import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import {
	categories,
	type DayOfWeek,
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
				isOpen,
			};
		});
	});

/**
 * Get a store by its slug with full menu data for the customer-facing shop.
 * Returns nested categories with items and their option groups.
 */
export const getStoreBySlug = createServerFn({ method: "GET" })
	.inputValidator(storeBySlugSchema)
	.handler(async ({ data }) => {
		// Fetch store with all related data
		const store = await db.query.stores.findFirst({
			where: and(eq(stores.slug, data.slug), eq(stores.isActive, true)),
			with: {
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
			...storeData
		} = store;

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

		// Transform items to include option groups properly structured
		const categoriesWithItems = storeCategories.map((category) => ({
			id: category.id,
			name: category.name,
			description: category.description,
			displayOrder: category.displayOrder,
			items: category.items.map((item) => ({
				id: item.id,
				name: item.name,
				description: item.description,
				price: item.price,
				imageUrl: item.imageUrl,
				allergens: item.allergens,
				displayOrder: item.displayOrder,
				optionGroups: item.itemOptionGroups
					.map((iog) => iog.optionGroup)
					.filter((og) => og.isActive)
					.map((og) => ({
						id: og.id,
						name: og.name,
						description: og.description,
						isRequired: og.isRequired,
						minSelections: og.minSelections,
						maxSelections: og.maxSelections,
						displayOrder: og.displayOrder,
						choices: og.optionChoices.map((choice) => ({
							id: choice.id,
							name: choice.name,
							priceModifier: choice.priceModifier,
							displayOrder: choice.displayOrder,
						})),
					})),
			})),
		}));

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
