"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/features/shop/cart-context";
import { CategoryNav } from "@/features/shop/components/category-nav";
import { FloatingCart } from "@/features/shop/components/floating-cart";
import { ItemSheet } from "@/features/shop/components/item-sheet";
import { MenuItemCard } from "@/features/shop/components/menu-item-card";
import { StorePageSkeleton } from "@/features/shop/components/menu-item-skeleton";
import { StoreHero } from "@/features/shop/components/store-hero";
import { shopQueries } from "@/features/shop/queries";

export const Route = createFileRoute("/shop/$slug")({
	loader: async ({ context, params }) => {
		const store = await context.queryClient.ensureQueryData(
			shopQueries.storeBySlug(params.slug),
		);
		if (!store) {
			throw notFound();
		}
		return store;
	},
	component: StoreMenuPage,
	notFoundComponent: StoreNotFound,
	pendingComponent: StorePageLoading,
});

// Type for menu item from the API
interface MenuItem {
	id: number;
	name: string;
	description: string | null;
	price: number;
	imageUrl: string | null;
	allergens: string[] | null;
	displayOrder: number;
	optionGroups: {
		id: number;
		name: string;
		description: string | null;
		isRequired: boolean;
		minSelections: number;
		maxSelections: number | null; // null = unlimited
		displayOrder: number;
		choices: {
			id: number;
			name: string;
			priceModifier: number;
			displayOrder: number;
		}[];
	}[];
}

function StoreMenuPage() {
	const { slug } = Route.useParams();
	const { data: store } = useSuspenseQuery(shopQueries.storeBySlug(slug));
	const { setStore } = useCart();

	// Set the store in cart context (clears cart if different store)
	useEffect(() => {
		if (store) {
			setStore(store.slug);
		}
	}, [store, setStore]);

	// Category scroll state
	const [activeCategoryId, setActiveCategoryId] = useState<number | null>(
		store.categories[0]?.id ?? null,
	);
	const categoryRefs = useRef<Map<number, HTMLDivElement>>(new Map());

	// Item sheet state
	const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
	const [isItemSheetOpen, setIsItemSheetOpen] = useState(false);

	// Handle category click - scroll to section
	const handleCategoryClick = useCallback((categoryId: number) => {
		const element = categoryRefs.current.get(categoryId);
		if (element) {
			const headerOffset = 56 + 48; // Header + CategoryNav height
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.scrollY - headerOffset;

			window.scrollTo({
				top: offsetPosition,
				behavior: "smooth",
			});
		}
	}, []);

	// Intersection observer for active category
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const categoryId = Number(
							entry.target.getAttribute("data-category-id"),
						);
						if (!Number.isNaN(categoryId)) {
							setActiveCategoryId(categoryId);
						}
					}
				}
			},
			{
				rootMargin: "-120px 0px -70% 0px",
				threshold: 0,
			},
		);

		// Observe each category section element
		for (const category of store.categories) {
			const element = categoryRefs.current.get(category.id);
			if (element) {
				observer.observe(element);
			}
		}

		return () => observer.disconnect();
	}, [store.categories]);

	// Handle item selection
	const handleItemSelect = useCallback((item: MenuItem) => {
		// Add isDefault: false to choices since the API doesn't include it
		const itemWithDefaults: MenuItem = {
			...item,
			optionGroups: item.optionGroups.map((group) => ({
				...group,
				choices: group.choices.map((choice, idx) => ({
					...choice,
					isDefault: idx === 0 && group.isRequired && group.maxSelections === 1,
				})),
			})),
		};
		setSelectedItem(itemWithDefaults);
		setIsItemSheetOpen(true);
	}, []);

	// Store ref setter
	const setCategoryRef = useCallback(
		(categoryId: number) => (el: HTMLDivElement | null) => {
			if (el) {
				categoryRefs.current.set(categoryId, el);
			} else {
				categoryRefs.current.delete(categoryId);
			}
		},
		[],
	);

	return (
		<div className="min-h-screen pb-24">
			{/* Store hero */}
			<StoreHero store={store} />

			{/* Category navigation */}
			<CategoryNav
				categories={store.categories.map((c) => ({ id: c.id, name: c.name }))}
				activeCategoryId={activeCategoryId}
				onCategoryClick={handleCategoryClick}
			/>

			{/* Menu sections */}
			<div className="px-4 py-4">
				{store.categories.length === 0 ? (
					<EmptyMenuState />
				) : (
					store.categories.map((category) => (
						<section
							key={category.id}
							ref={setCategoryRef(category.id)}
							data-category-id={category.id}
							className="mb-8"
						>
							{/* Category header */}
							<h2
								className="mb-3 text-xl text-shop-foreground"
								style={{ fontFamily: "var(--font-heading)" }}
							>
								{category.name}
							</h2>
							{category.description && (
								<p className="mb-4 text-sm text-shop-foreground-muted">
									{category.description}
								</p>
							)}

							{/* Items grid */}
							<div className="space-y-3">
								{category.items.map((item) => (
									<MenuItemCard
										key={item.id}
										item={{
											...item,
											hasOptions: item.optionGroups.length > 0,
										}}
										onSelect={() => handleItemSelect(item)}
									/>
								))}
							</div>
						</section>
					))
				)}
			</div>

			{/* Item customization sheet */}
			<ItemSheet
				item={
					selectedItem
						? {
								...selectedItem,
								optionGroups: selectedItem.optionGroups.map((group) => ({
									...group,
									choices: group.choices.map((choice, idx) => ({
										...choice,
										isDefault:
											idx === 0 &&
											group.isRequired &&
											group.maxSelections === 1,
									})),
								})),
							}
						: null
				}
				open={isItemSheetOpen}
				onOpenChange={setIsItemSheetOpen}
				storeId={store.id}
				storeSlug={store.slug}
			/>

			{/* Floating cart button (mobile) */}
			<FloatingCart />
		</div>
	);
}

function EmptyMenuState() {
	return (
		<div className="flex flex-col items-center justify-center py-20 text-center">
			<div
				className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
				style={{ backgroundColor: "var(--shop-background-subtle)" }}
			>
				<UtensilsCrossed className="h-8 w-8 text-shop-foreground-muted" />
			</div>
			<h2
				className="text-xl text-shop-foreground"
				style={{ fontFamily: "var(--font-heading)" }}
			>
				Menu coming soon
			</h2>
			<p className="mt-1 max-w-sm text-shop-foreground-muted">
				This restaurant is still setting up their menu. Check back later!
			</p>
		</div>
	);
}

function StorePageLoading() {
	return <StorePageSkeleton />;
}

function StoreNotFound() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
			<div
				className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
				style={{ backgroundColor: "var(--shop-background-subtle)" }}
			>
				<UtensilsCrossed className="h-8 w-8 text-shop-foreground-muted" />
			</div>
			<h1
				className="text-2xl text-shop-foreground"
				style={{ fontFamily: "var(--font-heading)" }}
			>
				Restaurant not found
			</h1>
			<p className="mt-2 max-w-sm text-shop-foreground-muted">
				The restaurant you're looking for doesn't exist or is no longer
				available.
			</p>
		</div>
	);
}
