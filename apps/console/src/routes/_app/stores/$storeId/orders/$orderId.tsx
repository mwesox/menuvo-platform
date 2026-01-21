import { VStack } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { OrderDetail } from "@/features/orders/components/order-detail";
import { trpcUtils } from "@/lib/trpc";

export const Route = createFileRoute("/_app/stores/$storeId/orders/$orderId")({
	loader: async ({ params }) => {
		const order = await trpcUtils.order.getById.ensureData({
			orderId: params.orderId,
		});
		return order;
	},
	component: OrderDetailPage,
	errorComponent: ConsoleError,
});

function OrderDetailPage() {
	const store = useStore();
	const { orderId } = Route.useParams();
	const { t } = useTranslation("console-orders");
	const order = Route.useLoaderData();

	if (!order) {
		return null;
	}

	const orderNumber = `#${String(order.pickupNumber).padStart(3, "0")}`;

	return (
		<VStack gap="6" align="stretch">
			<PageActionBar
				breadcrumbs={[
					{
						label: t("title"),
						href: `/stores/${store.id}/orders`,
					},
					{ label: orderNumber },
				]}
			/>

			<OrderDetail orderId={orderId} />
		</VStack>
	);
}
