import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { z } from "zod";
import { CartDrawer } from "@/features/shop/cart";
import {
	ShopFooter,
	ShopHeader,
	ShopLayoutSkeleton,
} from "@/features/shop/layout";
import { shopQueries } from "@/features/shop/queries";
import {
	CookieBanner,
	CookieConsentProvider,
	ShopProvider,
	StoreError,
	StoreNotFound,
	useShop,
} from "@/features/shop/shared";

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
	loader: async ({ context, params }) => {
		// Prevent reserved paths from being treated as store slugs
		if (RESERVED_PATHS.includes(params.slug)) {
			throw notFound();
		}

		const store = await context.queryClient.ensureQueryData(
			shopQueries.storeBySlug(params.slug),
		);
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
	return (
		<ShopProvider>
			<StoreLayoutContent />
		</ShopProvider>
	);
}

function StoreLayoutContent() {
	const { isCartDrawerOpen, closeCartDrawer } = useShop();

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
