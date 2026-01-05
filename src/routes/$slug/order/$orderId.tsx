import { createFileRoute, notFound } from "@tanstack/react-router";
import {
	OrderConfirmationPage,
	OrderConfirmationPageSkeleton,
} from "@/features/shop/checkout";
import { StoreError } from "@/features/shop/shared";

export const Route = createFileRoute("/$slug/order/$orderId")({
	loader: async ({ params }) => {
		const orderId = Number.parseInt(params.orderId, 10);
		if (Number.isNaN(orderId) || orderId <= 0) {
			throw notFound();
		}
		return { orderId, storeSlug: params.slug };
	},
	component: OrderConfirmationRouteComponent,
	pendingComponent: OrderConfirmationPageSkeleton,
	errorComponent: StoreError,
});

function OrderConfirmationRouteComponent() {
	const { orderId, storeSlug } = Route.useLoaderData();

	return <OrderConfirmationPage orderId={orderId} storeSlug={storeSlug} />;
}
