import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod/v4";
import { getMenuLanguageCode } from "../../../features/menu/queries";
import {
	OrderingPageSkeleton,
	OrderingReturnPage,
} from "../../../features/ordering";
import { StoreError } from "../../../features/shared";
import { trpcUtils } from "../../../lib/trpc";

const searchSchema = z.object({
	order_id: z.coerce.string().optional(), // Order ID (passed in return URL from PayPal)
});

export const Route = createFileRoute("/$slug/ordering/return")({
	validateSearch: searchSchema,
	loader: async ({ params }) => {
		const languageCode = getMenuLanguageCode();
		// Use light query - reuses cache from menu page
		const data = await trpcUtils.menu.shop.getMenu.ensureData({
			storeSlug: params.slug,
			languageCode,
		});
		if (!data) {
			throw notFound();
		}
		return data;
	},
	component: OrderingReturnRouteComponent,
	pendingComponent: OrderingPageSkeleton,
	errorComponent: StoreError,
});

function OrderingReturnRouteComponent() {
	const data = Route.useLoaderData();
	return <OrderingReturnPage storeSlug={data.store.slug} />;
}
