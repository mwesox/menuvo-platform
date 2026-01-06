import { createFileRoute, notFound } from "@tanstack/react-router";
import { CheckoutPage, CheckoutPageSkeleton } from "@/features/shop/checkout";
import { shopQueries } from "@/features/shop/queries";
import { StoreError } from "@/features/shop/shared";

export const Route = createFileRoute("/$slug/checkout/")({
	loader: async ({ context, params }) => {
		// Use light query - reuses cache from menu page
		const store = await context.queryClient.ensureQueryData(
			shopQueries.menu(params.slug),
		);
		if (!store) {
			throw notFound();
		}
		return store;
	},
	component: CheckoutRouteComponent,
	pendingComponent: CheckoutPageSkeleton,
	errorComponent: StoreError,
});

function CheckoutRouteComponent() {
	const store = Route.useLoaderData();

	// Note: Cart emptiness check is done client-side in the component
	// since cart is stored in localStorage

	return (
		<CheckoutPage
			storeId={store.id}
			storeSlug={store.slug}
			capabilities={store.capabilities}
		/>
	);
}
