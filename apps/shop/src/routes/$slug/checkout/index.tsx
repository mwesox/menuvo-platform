import { createFileRoute, notFound } from "@tanstack/react-router";
import { CheckoutPage, CheckoutPageSkeleton } from "../../../features/checkout";
import { shopQueries } from "../../../features/queries";
import { StoreError } from "../../../features/shared";
import { defaultCapabilities } from "../../../lib/capabilities";

export const Route = createFileRoute("/$slug/checkout/")({
	loader: async ({ context, params }) => {
		// Use light query - reuses cache from menu page
		const data = await context.queryClient.ensureQueryData(
			shopQueries.menu(params.slug),
		);
		if (!data) {
			throw notFound();
		}
		return data;
	},
	component: CheckoutRouteComponent,
	pendingComponent: CheckoutPageSkeleton,
	errorComponent: StoreError,
});

function CheckoutRouteComponent() {
	const data = Route.useLoaderData();
	const { store } = data;

	// Note: Cart emptiness check is done client-side in the component
	// since cart is stored in localStorage

	// TODO: Fetch capabilities from API when implemented
	// For now, use default capabilities (payments disabled)
	return (
		<CheckoutPage
			storeId={store.id}
			storeSlug={store.slug}
			capabilities={defaultCapabilities}
		/>
	);
}
