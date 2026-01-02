"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useEffect } from "react";
import { FloatingCart, useCartStore } from "../../cart";
import { shopQueries } from "../../queries";
import { useShop } from "../../shared";
import {
	useCategoryScroll,
	useMenuItemSelection,
	useQRTracking,
} from "../hooks";
import { CategoryNav } from "./category-nav";
import { CategorySection } from "./category-section";
import { EmptyMenuState } from "./empty-menu-state";
import { ItemDrawer } from "./item-drawer";
import { StorePageSkeleton } from "./menu-item-skeleton";
import { StoreHero } from "./store-hero";

const routeApi = getRouteApi("/shop/$slug/");

/**
 * Main store menu page component.
 * Displays the store hero, category navigation, and menu items.
 */
export function StoreMenuPage() {
	const { slug } = routeApi.useParams();
	const { sp: servicePointCode } = routeApi.useSearch();
	const { data: store } = useSuspenseQuery(shopQueries.storeBySlug(slug));

	const setStore = useCartStore((s) => s.setStore);
	const { setStoreName } = useShop();

	// Set the store in cart context (clears cart if different store)
	// and set store name in shop context for header
	useEffect(() => {
		if (store) {
			setStore(store.slug);
			setStoreName(store.name);
		}
	}, [store, setStore, setStoreName]);

	// Track QR code scans
	useQRTracking(store, servicePointCode);

	// Category scroll tracking
	const { activeCategoryId, setCategoryRef, handleCategoryClick } =
		useCategoryScroll({ categories: store.categories });

	// Item selection and drawer state
	const {
		selectedItem,
		isItemDrawerOpen,
		handleItemSelect,
		setIsItemDrawerOpen,
	} = useMenuItemSelection();

	return (
		<div className="min-h-screen pb-24">
			<div className="mx-auto max-w-3xl">
				<StoreHero store={store} />

				<CategoryNav
					categories={store.categories.map(
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
					) : (
						store.categories.map(
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
