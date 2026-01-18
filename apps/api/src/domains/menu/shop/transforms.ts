/**
 * Shop Transform Utilities
 *
 * Transforms DB data to shop format.
 */

import { DEFAULT_ORDER_TYPES } from "../../stores/settings/types.js";
import type { MenuResponse } from "../schemas.js";
import { getTranslatedDescription, getTranslatedName } from "../utils.js";

// Type inferred from query result
type StoreWithMenuRelations = NonNullable<
	Awaited<ReturnType<typeof import("./queries.js").getMenuDataForShop>>
>;

/**
 * Transform store with relations to shop menu format
 */
export function transformMenuToShop(
	store: StoreWithMenuRelations,
	languageCode: string,
	status?: { isOpen: boolean; nextOpenTime: string | null },
): MenuResponse {
	// Get order types config with defaults
	const orderTypesConfig = store.settings?.orderTypes ?? DEFAULT_ORDER_TYPES;
	const enabledOrderTypes = {
		dine_in: orderTypesConfig.dine_in.enabled,
		takeaway: orderTypesConfig.takeaway.enabled,
		delivery: orderTypesConfig.delivery.enabled,
	};

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
			enabledOrderTypes,
			...(status && { status }),
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
				description: getTranslatedDescription(item.translations, languageCode),
				price: item.price,
				imageUrl: item.imageUrl,
				allergens: item.allergens,
				displayOrder: item.displayOrder,
				hasOptionGroups: item.optGroups.length > 0,
			})),
		})),
		capabilities: {
			canAcceptOnlinePayment: store.merchant?.mollieCanReceivePayments === true,
		},
	};
}

// Type inferred from query result
type ItemDetailsQueryResult = NonNullable<
	Awaited<ReturnType<typeof import("./queries.js").getItemDetailsDataForShop>>
>;
type ItemWithRelations = ItemDetailsQueryResult["item"];
type ItemOptionGroupsWithRelations =
	ItemDetailsQueryResult["itemOptGroups"][number];

/**
 * Transform item with option groups to shop format
 */
export function transformItemDetailsToShop(
	item: ItemWithRelations,
	itemOptGroups: ItemOptionGroupsWithRelations[],
	languageCode: string,
) {
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
}
