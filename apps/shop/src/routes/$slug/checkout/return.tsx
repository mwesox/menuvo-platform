import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { CheckoutPageSkeleton } from "../../../features/checkout";
import { CheckoutReturnPage } from "../../../features/checkout/components/checkout-return-page";
import { shopQueries } from "../../../features/queries";
import { StoreError } from "../../../features/shared";

const searchSchema = z.object({
	session_id: z.string().optional(), // Stripe session ID
	order_id: z.coerce.string().optional(), // Mollie order ID (passed in return URL)
});

export const Route = createFileRoute("/$slug/checkout/return")({
	validateSearch: searchSchema,
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
	component: CheckoutReturnRouteComponent,
	pendingComponent: CheckoutPageSkeleton,
	errorComponent: StoreError,
});

function CheckoutReturnRouteComponent() {
	const data = Route.useLoaderData();
	return <CheckoutReturnPage storeSlug={data.store.slug} />;
}
