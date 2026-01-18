import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { useCallback, useContext, useRef } from "react";
import { z } from "zod/v4";
import { CartDrawer } from "../../features/cart";
import {
	ShopFooter,
	ShopHeader,
	ShopLayoutSkeleton,
} from "../../features/layout";
import { CategoryNav } from "../../features/menu/components/category-nav";
import { getMenuLanguageCode } from "../../features/menu/queries";
import {
	CookieBanner,
	CookieConsentProvider,
	MenuContext,
	MenuProvider,
	StoreError,
	StoreNotFound,
	StoreProvider,
	useShopUIStore,
} from "../../features/shared";
import { trpcUtils } from "../../lib/trpc";

// Reserved paths that should not be caught by the $slug route
const RESERVED_PATHS = [
	"console",
	"api",
	"q",
	"health",
	"business",
	"webhooks",
	"live",
	"shop",
];

const searchSchema = z.object({
	sp: z.string().optional(),
});

export const Route = createFileRoute("/$slug")({
	validateSearch: searchSchema,
	loader: async ({ params }) => {
		// Prevent reserved paths from being treated as store slugs
		if (RESERVED_PATHS.includes(params.slug)) {
			throw notFound();
		}

		const languageCode = getMenuLanguageCode();

		// Use light query for efficient initial load
		const store = await trpcUtils.menu.shop.getMenu.ensureData({
			storeSlug: params.slug,
			languageCode,
		});
		if (!store) {
			throw notFound();
		}
		return store;
	},
	component: StoreSlugLayout,
	pendingComponent: ShopLayoutSkeleton,
	notFoundComponent: StoreNotFound,
	errorComponent: StoreError,
});

function StoreSlugLayout() {
	const menuData = Route.useLoaderData();
	const { store, categories } = menuData;

	return (
		<StoreProvider store={store}>
			<MenuProvider store={store} categories={categories}>
				<StoreLayoutContent />
			</MenuProvider>
		</StoreProvider>
	);
}

function StoreLayoutContent() {
	const isCartDrawerOpen = useShopUIStore((s) => s.isCartDrawerOpen);
	const closeCartDrawer = useShopUIStore((s) => s.closeCartDrawer);
	const isCartSidebarCollapsed = useShopUIStore(
		(s) => s.isCartSidebarCollapsed,
	);
	const activeCategoryId = useShopUIStore((s) => s.activeCategoryId);
	const setActiveCategoryId = useShopUIStore((s) => s.setActiveCategoryId);
	const categoryRefs = useShopUIStore((s) => s.categoryRefs);

	const menuData = useContext(MenuContext);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const categories = menuData?.categories ?? [];

	// Handle category click - scroll to section in the scroll container
	const handleCategoryClick = useCallback(
		(categoryId: string) => {
			setActiveCategoryId(categoryId);

			const element = categoryRefs.get(categoryId);
			const container = scrollContainerRef.current;

			if (element && container) {
				const containerRect = container.getBoundingClientRect();
				const elementRect = element.getBoundingClientRect();
				const offsetTop =
					elementRect.top - containerRect.top + container.scrollTop;

				container.scrollTo({
					top: offsetTop - 16, // Small padding
					behavior: "smooth",
				});
			}
		},
		[categoryRefs, setActiveCategoryId],
	);

	return (
		<CookieConsentProvider>
			<div className="flex h-screen flex-col bg-background">
				{/* Fixed header area */}
				<ShopHeader />
				<CategoryNav
					categories={categories.map((c) => ({ id: c.id, name: c.name }))}
					activeCategoryId={activeCategoryId}
					onCategoryClick={handleCategoryClick}
				/>
				{/* Scrollable content area */}
				<main ref={scrollContainerRef} className="flex-1 overflow-y-auto">
					{/* Reserve right margin for fixed sidebar on desktop lg+ (when not collapsed) */}
					<div className={!isCartSidebarCollapsed ? "lg:mr-80" : ""}>
						<Outlet />
						<ShopFooter />
					</div>
				</main>
				{/* Cart drawer - handles both mobile (bottom sheet) and desktop (fixed sidebar) */}
				<CartDrawer
					open={isCartDrawerOpen}
					onOpenChange={(open) => !open && closeCartDrawer()}
				/>
			</div>
			<CookieBanner />
		</CookieConsentProvider>
	);
}
