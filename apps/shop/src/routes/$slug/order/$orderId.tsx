import { createFileRoute } from "@tanstack/react-router";
import {
	OrderConfirmationPage,
	OrderConfirmationPageSkeleton,
} from "../../../features/ordering";
import { StoreError } from "../../../features/shared";

export const Route = createFileRoute("/$slug/order/$orderId")({
	loader: async ({ params }) => {
		const orderId = params.orderId;
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
