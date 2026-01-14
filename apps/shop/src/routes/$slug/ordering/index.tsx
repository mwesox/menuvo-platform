import { createFileRoute, notFound } from "@tanstack/react-router";
import { getMenuLanguageCode } from "../../../features/menu/queries";
import { OrderingPage, OrderingPageSkeleton } from "../../../features/ordering";
import { StoreError } from "../../../features/shared";
import type { MerchantCapabilities } from "../../../lib/capabilities";
import { trpcUtils } from "../../../lib/trpc";

export const Route = createFileRoute("/$slug/ordering/")({
	loader: async ({ params }) => {
		const languageCode = getMenuLanguageCode();
		// Use ordering-specific query with staleTime: 0 for fresh capabilities
		const data = await trpcUtils.menu.shop.getMenu.fetch(
			{ storeSlug: params.slug, languageCode },
			{ staleTime: 0 },
		);
		if (!data) {
			throw notFound();
		}
		return data;
	},
	component: OrderingRouteComponent,
	pendingComponent: OrderingPageSkeleton,
	errorComponent: StoreError,
});

function OrderingRouteComponent() {
	const data = Route.useLoaderData();
	const { store, capabilities } = data;

	// Note: Cart emptiness check is done client-side in the component
	// since cart is stored in localStorage

	// Build MerchantCapabilities from API response
	const merchantCapabilities: MerchantCapabilities = {
		canAcceptPayments: capabilities?.canAcceptOnlinePayment ?? false,
		hasMollie: capabilities?.canAcceptOnlinePayment ?? false,
		paymentMethods: capabilities?.canAcceptOnlinePayment ? ["mollie"] : [],
		canPlaceOrders: capabilities?.canAcceptOnlinePayment ?? false,
		isOpen: store.status?.isOpen ?? true,
	};

	return (
		<OrderingPage
			storeId={store.id}
			storeSlug={store.slug}
			capabilities={merchantCapabilities}
			storeStatus={store.status}
		/>
	);
}
