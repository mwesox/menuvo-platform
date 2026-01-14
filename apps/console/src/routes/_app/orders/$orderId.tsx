import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { ConsoleError } from "@/features/components/console-error";
import { OrderDetail } from "@/features/orders/components/order-detail";
import { trpcUtils } from "@/lib/trpc";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute("/_app/orders/$orderId")({
	validateSearch: searchSchema,
	loader: async ({ params }) => {
		const order = await trpcUtils.order.getById.ensureData({
			orderId: params.orderId,
		});
		return order;
	},
	loaderDeps: ({ search }) => ({ storeId: search.storeId }),
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { storeId } = Route.useSearch();
	const { orderId } = Route.useParams();
	const { t } = useTranslation("console-orders");
	const order = Route.useLoaderData();

	if (!order) {
		return null;
	}

	const orderNumber = `#${String(order.pickupNumber).padStart(3, "0")}`;

	return (
		<div className="space-y-6">
			<PageActionBar
				breadcrumbs={[
					{ label: t("title"), href: "/orders", search: { storeId } },
					{ label: orderNumber },
				]}
			/>

			<OrderDetail orderId={orderId} />
		</div>
	);
}
