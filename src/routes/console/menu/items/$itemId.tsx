import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/features/console/menu/components/item-form";
import { itemQueries } from "@/features/console/menu/queries";
import { getItemOptions } from "@/features/console/menu/server/options.functions";
import { storeQueries } from "@/features/console/stores/queries";

export const Route = createFileRoute("/console/menu/items/$itemId")({
	loader: async ({ context, params }) => {
		const itemId = Number.parseInt(params.itemId, 10);
		const [item, itemOptions] = await Promise.all([
			context.queryClient.ensureQueryData(itemQueries.detail(itemId)),
			getItemOptions({ data: { itemId } }),
		]);
		// Prefetch store data for merchantId
		await context.queryClient.ensureQueryData(
			storeQueries.detail(item.storeId),
		);
		return { initialOptionGroupIds: itemOptions.map((og) => og.id) };
	},
	component: EditItemPage,
});

function EditItemPage() {
	const { t } = useTranslation("menu");
	const { itemId } = Route.useParams();
	const { initialOptionGroupIds } = Route.useLoaderData();
	const itemIdNum = Number.parseInt(itemId, 10);
	const { data: item } = useSuspenseQuery(itemQueries.detail(itemIdNum));
	const { data: store } = useSuspenseQuery(storeQueries.detail(item.storeId));

	return (
		<div>
			<div className="mb-4">
				<Button variant="ghost" size="sm" asChild>
					<Link
						to="/console/menu"
						search={{ storeId: item.storeId, tab: "items" as const }}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						{t("navigation.backToItems")}
					</Link>
				</Button>
			</div>

			<PageHeader
				title={t("pageHeaders.editItemTitle")}
				description={t("pageHeaders.editItemDescription", {
					itemName: item.name,
				})}
			/>

			<ItemForm
				item={item}
				categoryId={item.categoryId}
				storeId={item.storeId}
				merchantId={store.merchantId}
				initialOptionGroupIds={initialOptionGroupIds}
			/>
		</div>
	);
}
