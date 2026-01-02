import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { z } from "zod";
import { CartDrawer } from "@/features/shop/cart";
import { ShopFooter, ShopHeader } from "@/features/shop/layout";
import { shopQueries } from "@/features/shop/queries";
import {
	ShopProvider,
	StoreError,
	StoreNotFound,
	useShop,
} from "@/features/shop/shared";

const searchSchema = z.object({
	sp: z.string().optional(),
});

export const Route = createFileRoute("/shop/$slug")({
	validateSearch: searchSchema,
	loader: async ({ context, params }) => {
		const store = await context.queryClient.ensureQueryData(
			shopQueries.storeBySlug(params.slug),
		);
		if (!store) {
			throw notFound();
		}
		return store;
	},
	component: StoreSlugLayout,
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
		<>
			<ShopHeader />
			<main className="flex-1">
				<Outlet />
			</main>
			<ShopFooter />
			<CartDrawer
				open={isCartDrawerOpen}
				onOpenChange={(open) => !open && closeCartDrawer()}
			/>
		</>
	);
}
