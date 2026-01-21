import { Box, Center, Text } from "@chakra-ui/react";
import {
	useCallback,
	useContext,
	useDeferredValue,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
	CategorySection,
	EmptyMenuState,
	ItemDrawer,
	StorePageSkeleton,
} from "@/features";
import { FloatingCart, useCartStore } from "../../cart";
import { CATEGORY_INTERSECTION_ROOT_MARGIN } from "../../constants";
import { MenuContext, useShopUIStore } from "../../shared";
import type { MenuCategory, MenuItemLight } from "../types";

/**
 * Main store menu page component.
 * Displays category navigation and menu items.
 * Uses light query - option groups are fetched on demand when opening item drawer.
 */
export function StoreMenuPage() {
	const { t } = useTranslation("shop");
	const menuData = useContext(MenuContext);

	if (!menuData?.store) {
		return <StorePageSkeleton />;
	}

	const { store, categories } = menuData;

	const setStore = useCartStore((s) => s.setStore);

	// Set the store in cart context
	useEffect(() => {
		setStore(store.slug);
	}, [store.slug, setStore]);

	// Menu search filtering (inlined from useMenuSearch)
	const searchQuery = useShopUIStore((s) => s.searchQuery);
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
					(item: MenuCategory["items"][number]) =>
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
			.filter((category): category is MenuCategory => category !== null);
	}, [categories, deferredQuery]);

	const hasResults = filteredCategories.length > 0;
	const isSearching = deferredQuery.length > 0;

	// Category navigation state from store (shared with layout)
	const setActiveCategoryId = useShopUIStore((s) => s.setActiveCategoryId);
	const setCategoryRef = useShopUIStore((s) => s.setCategoryRef);
	const categoryRefs = useShopUIStore((s) => s.categoryRefs);

	// Initialize active category on mount
	useEffect(() => {
		const firstCategory = filteredCategories[0];
		if (firstCategory) {
			setActiveCategoryId(firstCategory.id);
		}
	}, [filteredCategories, setActiveCategoryId]);

	// Ref setter for category sections
	const handleCategoryRef = useCallback(
		(categoryId: React.Key | null | undefined) =>
			(el: HTMLDivElement | null) => {
				if (typeof categoryId !== "string") return;
				setCategoryRef(categoryId, el);
			},
		[setCategoryRef],
	);

	// Intersection observer for active category tracking
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const categoryId = entry.target.getAttribute("data-category-id");
						if (categoryId) {
							setActiveCategoryId(categoryId);
						}
					}
				}
			},
			{
				rootMargin: CATEGORY_INTERSECTION_ROOT_MARGIN,
				threshold: 0,
			},
		);

		// Observe each category section element
		for (const category of filteredCategories) {
			const element = categoryRefs.get(category.id);
			if (element) {
				observer.observe(element);
			}
		}

		return () => observer.disconnect();
	}, [filteredCategories, categoryRefs, setActiveCategoryId]);

	// Item selection and drawer state (inlined from useMenuItemSelection)
	const [selectedItem, setSelectedItem] = useState<MenuItemLight | null>(null);
	const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);

	const handleItemSelect = useCallback((item: MenuItemLight) => {
		setSelectedItem(item);
		setIsItemDrawerOpen(true);
	}, []);

	return (
		<Box pb="24">
			<Box maxW="6xl" mx="auto" px="4" py="4">
				{categories.length === 0 ? (
					<EmptyMenuState />
				) : isSearching && !hasResults ? (
					<Center py="12">
						<Text color="fg.muted">
							{t("menu.noSearchResults", "No items found")}
						</Text>
					</Center>
				) : (
					filteredCategories.map((category: (typeof categories)[number]) => (
						<CategorySection
							key={category.id}
							category={category}
							onItemSelect={handleItemSelect}
							refSetter={handleCategoryRef(category.id)}
						/>
					))
				)}
			</Box>

			{selectedItem && (
				<ItemDrawer
					item={selectedItem}
					open={isItemDrawerOpen}
					onOpenChange={setIsItemDrawerOpen}
					storeId={store.id}
					storeSlug={store.slug}
					isOpen={true}
				/>
			)}

			<FloatingCart />
		</Box>
	);
}

/**
 * Loading skeleton for the store menu page.
 */
export function StoreMenuPageSkeleton() {
	return <StorePageSkeleton />;
}
