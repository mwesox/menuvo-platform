import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { z } from "zod/v4";
import { CartDrawer } from "../../features/cart";
import {
	ShopFooter,
	ShopHeader,
	ShopLayoutSkeleton,
} from "../../features/layout";
import { getMenuLanguageCode } from "../../features/menu/queries";
import {
	CookieBanner,
	CookieConsentProvider,
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

	return (
		<CookieConsentProvider>
			<div className="flex min-h-screen flex-col bg-background">
				<ShopHeader />
				<main className="flex-1">
					<Outlet />
				</main>
				<ShopFooter />
				<CartDrawer
					open={isCartDrawerOpen}
					onOpenChange={(open) => !open && closeCartDrawer()}
				/>
			</div>
			<CookieBanner />
		</CookieConsentProvider>
	);
}
