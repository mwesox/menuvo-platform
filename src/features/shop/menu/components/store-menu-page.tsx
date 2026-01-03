"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FloatingCart, useCartStore } from "../../cart";
import { shopQueries } from "../../queries";
import {
	useCategoryScroll,
	useMenuItemSelection,
	useMenuSearch,
} from "../hooks";
import { CategoryNav } from "./category-nav";
import { CategorySection } from "./category-section";
import { EmptyMenuState } from "./empty-menu-state";
import { ItemDrawer } from "./item-drawer";
import { StorePageSkeleton } from "./menu-item-skeleton";

const routeApi = getRouteApi("/shop/$slug/");

/**
 * Main store menu page component.
 * Displays category navigation and menu items.
 */
export function StoreMenuPage() {
	const { t } = useTranslation("shop");
	const { slug } = routeApi.useParams();
	const { data: store } = useSuspenseQuery(shopQueries.storeBySlug(slug));

	const setStore = useCartStore((s) => s.setStore);

	// Set the store in cart context
	useEffect(() => {
		if (store) {
			setStore(store.slug);
		}
	}, [store, setStore]);

	// Menu search filtering
	const { filteredCategories, isSearching, hasResults } = useMenuSearch(
		store.categories,
	);

	// Category scroll tracking (use filtered categories)
	const { activeCategoryId, setCategoryRef, handleCategoryClick } =
		useCategoryScroll({ categories: filteredCategories });

	// Item selection and drawer state
	const {
		selectedItem,
		isItemDrawerOpen,
		handleItemSelect,
		setIsItemDrawerOpen,
	} = useMenuItemSelection();

	return (
		<div className="min-h-screen pb-24">
			<div className="mx-auto max-w-6xl">
				<CategoryNav
					categories={filteredCategories.map(
						(c: { id: number; name: string; items: unknown[] }) => ({
							id: c.id,
							name: c.name,
							itemCount: c.items.length,
						}),
					)}
					activeCategoryId={activeCategoryId}
					onCategoryClick={handleCategoryClick}
				/>

				<div className="px-4 py-4">
					{store.categories.length === 0 ? (
						<EmptyMenuState />
					) : isSearching && !hasResults ? (
						<div className="py-12 text-center">
							<p className="text-muted-foreground">
								{t("menu.noSearchResults", "No items found")}
							</p>
						</div>
					) : (
						filteredCategories.map(
							(category: (typeof store.categories)[number]) => (
								<CategorySection
									key={category.id}
									category={category}
									onItemSelect={handleItemSelect}
									refSetter={setCategoryRef(category.id)}
								/>
							),
						)
					)}
				</div>
			</div>

			<ItemDrawer
				item={selectedItem}
				open={isItemDrawerOpen}
				onOpenChange={setIsItemDrawerOpen}
				storeId={store.id}
				storeSlug={store.slug}
			/>

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
