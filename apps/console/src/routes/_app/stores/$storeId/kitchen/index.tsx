import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { KitchenPage } from "@/features/kitchen/components/kitchen-page";
import { trpcUtils } from "@/lib/trpc";

export const Route = createFileRoute("/_app/stores/$storeId/kitchen/")({
	loader: async ({ params }) => {
		await Promise.all([
			trpcUtils.order.listForKitchen.ensureData({
				storeId: params.storeId,
				limit: 50,
			}),
			trpcUtils.order.kitchenDone.ensureData({
				storeId: params.storeId,
				limit: 20,
			}),
		]);
	},
	component: KitchenRoutePage,
	errorComponent: ConsoleError,
});

function KitchenRoutePage() {
	const store = useStore();

	return (
		<KitchenPage
			search={{ storeId: store.id }}
			loaderData={{
				stores: [store],
				autoSelectedStoreId: store.id,
			}}
		/>
	);
}
