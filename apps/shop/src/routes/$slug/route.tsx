import { Box, Flex } from "@chakra-ui/react";
import {
	createFileRoute,
	notFound,
	Outlet,
	useMatchRoute,
} from "@tanstack/react-router";
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

	// Hide cart sidebar on ordering pages (cart is shown inline there)
	const matchRoute = useMatchRoute();
	const isOrderingRoute =
		matchRoute({ to: "/$slug/ordering", fuzzy: true }) !== false;
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
			<Flex direction="column" h="100vh" bg="bg">
				{/* Fixed header area */}
				<ShopHeader />
				<CategoryNav
					categories={categories.map((c) => ({ id: c.id, name: c.name }))}
					activeCategoryId={activeCategoryId}
					onCategoryClick={handleCategoryClick}
				/>
				{/* Scrollable content area */}
				<Box as="main" ref={scrollContainerRef} flex="1" overflowY="auto">
					{/* Reserve right margin for fixed sidebar on desktop lg+ (when not collapsed and not on ordering) */}
					<Box
						mr={{
							lg: !isCartSidebarCollapsed && !isOrderingRoute ? "80" : "0",
						}}
					>
						<Outlet />
						<ShopFooter />
					</Box>
				</Box>
				{/* Cart drawer - handles both mobile (bottom sheet) and desktop (fixed sidebar) */}
				{/* Hidden on ordering pages where cart is shown inline */}
				{!isOrderingRoute && (
					<CartDrawer
						open={isCartDrawerOpen}
						onOpenChange={(open) => !open && closeCartDrawer()}
					/>
				)}
			</Flex>
			<CookieBanner />
		</CookieConsentProvider>
	);
}
