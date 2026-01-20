import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { ItemForm } from "@/features/menu/components/item-form";
import { getDisplayName } from "@/features/menu/logic/display";
import { getCategoriesQueryOptions } from "@/features/menu/queries";
import {
	queryClient,
	trpc,
	trpcClient,
	trpcUtils,
	useTRPC,
	useTRPCClient,
} from "@/lib/trpc";

export const Route = createFileRoute(
	"/_app/stores/$storeId/menu/categories/$categoryId/items/$itemId",
)({
	loader: async ({ params }) => {
		const [item, itemOptions] = await Promise.all([
			trpcUtils.menu.items.getById.ensureData({ id: params.itemId }),
			trpcUtils.menu.options.getItemOptions.ensureData({
				itemId: params.itemId,
			}),
		]);

		await Promise.all([
			queryClient.ensureQueryData(
				getCategoriesQueryOptions(trpc, trpcClient, params.storeId),
			),
			trpcUtils.menu.categories.getById.ensureData({ id: params.categoryId }),
		]);

		return {
			item,
			initialOptionGroupIds: (itemOptions as Array<{ id: string }>).map(
				(og) => og.id,
			),
		};
	},
	component: EditItemPage,
	errorComponent: ConsoleError,
});

function EditItemPage() {
	const store = useStore();
	const { categoryId, itemId } = Route.useParams();
	const { item, initialOptionGroupIds } = Route.useLoaderData();
	const { t } = useTranslation("menu");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();

	const { data: currentItem } = useQuery({
		...trpc.menu.items.getById.queryOptions({ id: itemId }),
		initialData: item,
	});

	if (!currentItem) {
		return null;
	}

	const { data: categories = [] } = useQuery(
		getCategoriesQueryOptions(trpc, trpcClient, store.id),
	);
	const { data: category } = useQuery({
		...trpc.menu.categories.getById.queryOptions({ id: categoryId }),
	});

	if (!category) {
		return null;
	}

	const language = "de";
	const categoryName = getDisplayName(category.translations, language);
	const itemName = getDisplayName(currentItem.translations, language);

	return (
		<div className="space-y-6">
			<PageActionBar
				breadcrumbs={[
					{
						label: t("titles.categories"),
						href: `/stores/${store.id}/menu`,
					},
					{
						label: categoryName || t("emptyStates.unnamed"),
						href: `/stores/${store.id}/menu/categories/${categoryId}`,
					},
					{ label: itemName || t("emptyStates.unnamed") },
				]}
			/>

			<ItemForm
				item={currentItem}
				categories={categories}
				categoryId={categoryId}
				storeId={store.id}
				merchantId={store.merchantId}
				initialOptionGroupIds={initialOptionGroupIds}
			/>
		</div>
	);
}
