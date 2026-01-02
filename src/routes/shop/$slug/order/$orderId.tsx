import { createFileRoute, notFound } from "@tanstack/react-router";
import { OrderConfirmationPage } from "@/features/shop/checkout";

export const Route = createFileRoute("/shop/$slug/order/$orderId")({
	loader: async ({ params }) => {
		const orderId = Number.parseInt(params.orderId, 10);
		if (Number.isNaN(orderId) || orderId <= 0) {
			throw notFound();
		}
		return { orderId, storeSlug: params.slug };
	},
	component: OrderConfirmationRouteComponent,
});

function OrderConfirmationRouteComponent() {
	const { orderId, storeSlug } = Route.useLoaderData();

	return <OrderConfirmationPage orderId={orderId} storeSlug={storeSlug} />;
}
