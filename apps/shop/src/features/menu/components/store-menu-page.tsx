import {
	useCallback,
	useContext,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
	CategoryNav,
	CategorySection,
	EmptyMenuState,
	ItemDrawer,
	StorePageSkeleton,
} from "@/features";
import { FloatingCart, useCartStore } from "../../cart";
import {
	CATEGORY_INTERSECTION_ROOT_MARGIN,
	HEADER_OFFSET,
} from "../../constants";
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

	// Category scroll tracking (inlined from useCategoryScroll)
	const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
		filteredCategories[0]?.id ?? null,
	);
	const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());

	// Handle category click - scroll to section
	const handleCategoryClick = useCallback((categoryId: string) => {
		const element = categoryRefs.current.get(categoryId);
		if (element) {
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.scrollY - HEADER_OFFSET;

			window.scrollTo({
				top: offsetPosition,
				behavior: "smooth",
			});
		}
	}, []);

	// Store ref setter
	const setCategoryRef = useCallback(
		(categoryId: React.Key | null | undefined) =>
			(el: HTMLDivElement | null) => {
				if (typeof categoryId !== "string") return;
				if (el) {
					categoryRefs.current.set(categoryId, el);
				} else {
					categoryRefs.current.delete(categoryId);
				}
			},
		[],
	);

	// Intersection observer for active category
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
			const element = categoryRefs.current.get(category.id);
			if (element) {
				observer.observe(element);
			}
		}

		return () => observer.disconnect();
	}, [filteredCategories]);

	// Item selection and drawer state (inlined from useMenuItemSelection)
	const [selectedItem, setSelectedItem] = useState<MenuItemLight | null>(null);
	const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);

	const handleItemSelect = useCallback((item: MenuItemLight) => {
		setSelectedItem(item);
		setIsItemDrawerOpen(true);
	}, []);

	return (
		<div className="min-h-screen pb-24">
			<div className="mx-auto max-w-6xl">
				<CategoryNav
					categories={filteredCategories.map((category: MenuCategory) => ({
						id: category.id,
						name: category.name,
						itemCount: category.items.length,
					}))}
					activeCategoryId={activeCategoryId}
					onCategoryClick={handleCategoryClick}
				/>

				<div className="px-4 py-4">
					{categories.length === 0 ? (
						<EmptyMenuState />
					) : isSearching && !hasResults ? (
						<div className="py-12 text-center">
							<p className="text-muted-foreground">
								{t("menu.noSearchResults", "No items found")}
							</p>
						</div>
					) : (
						filteredCategories.map((category: (typeof categories)[number]) => (
							<CategorySection
								key={category.id}
								category={category}
								onItemSelect={handleItemSelect}
								refSetter={setCategoryRef(category.id)}
							/>
						))
					)}
				</div>
			</div>

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
		</div>
	);
}

/**
 * Loading skeleton for the store menu page.
 */
export function StoreMenuPageSkeleton() {
	return <StorePageSkeleton />;
}
