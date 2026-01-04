import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { CheckoutPageSkeleton } from "@/features/shop/checkout";
import { CheckoutReturnPage } from "@/features/shop/checkout/components/checkout-return-page";
import { shopQueries } from "@/features/shop/queries";
import { StoreError } from "@/features/shop/shared";

const searchSchema = z.object({
	session_id: z.string().optional(), // Stripe session ID
	order_id: z.coerce.string().optional(), // Mollie order ID (passed in return URL)
});

export const Route = createFileRoute("/shop/$slug/checkout/return")({
	validateSearch: searchSchema,
	loader: async ({ context, params }) => {
		const store = await context.queryClient.ensureQueryData(
			shopQueries.storeBySlug(params.slug),
		);
		if (!store) {
			throw notFound();
		}
		return { store };
	},
	component: CheckoutReturnRouteComponent,
	pendingComponent: CheckoutPageSkeleton,
	errorComponent: StoreError,
});

function CheckoutReturnRouteComponent() {
	const { store } = Route.useLoaderData();
	return <CheckoutReturnPage storeSlug={store.slug} />;
}
