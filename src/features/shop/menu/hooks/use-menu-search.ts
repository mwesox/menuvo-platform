import { useDeferredValue, useMemo } from "react";
import { useShop } from "../../shared/contexts/shop-context";

interface MenuItem {
	id: number;
	name: string;
	description: string | null;
}

interface Category {
	id: number;
	name: string;
	description: string | null;
	items: MenuItem[];
}

/**
 * Hook for filtering menu categories and items by search query.
 * Uses deferred value for smooth typing performance.
 */
export function useMenuSearch<T extends Category>(categories: T[]) {
	const { searchQuery } = useShop();
	const deferredQuery = useDeferredValue(searchQuery);

	const filteredCategories = useMemo(() => {
		const query = deferredQuery.toLowerCase().trim();

		if (!query) {
			return categories;
		}

		return categories
			.map((category) => {
				// Filter items that match the search query
				const matchingItems = category.items.filter(
					(item) =>
						item.name.toLowerCase().includes(query) ||
						item.description?.toLowerCase().includes(query),
				);

				// Include category if it has matching items or category name matches
				if (
					matchingItems.length > 0 ||
					category.name.toLowerCase().includes(query)
				) {
					return {
						...category,
						items: matchingItems.length > 0 ? matchingItems : category.items,
					};
				}

				return null;
			})
			.filter((category): category is T => category !== null);
	}, [categories, deferredQuery]);

	const hasResults = filteredCategories.length > 0;
	const isSearching = deferredQuery.length > 0;

	return {
		filteredCategories,
		hasResults,
		isSearching,
		searchQuery: deferredQuery,
	};
}
