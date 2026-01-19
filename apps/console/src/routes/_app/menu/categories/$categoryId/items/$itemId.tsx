import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { PageActionBar } from "@/components/layout/page-action-bar";
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

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute(
	"/_app/menu/categories/$categoryId/items/$itemId",
)({
	validateSearch: searchSchema,
	loader: async ({ params }) => {
		const [item, itemOptions] = await Promise.all([
			trpcUtils.menu.items.getById.ensureData({ id: params.itemId }),
			trpcUtils.menu.options.getItemOptions.ensureData({
				itemId: params.itemId,
			}),
		]);

		await Promise.all([
			trpcUtils.store.getById.ensureData({ storeId: item.storeId }),
			queryClient.ensureQueryData(
				getCategoriesQueryOptions(trpc, trpcClient, item.storeId),
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
	loaderDeps: ({ search }) => ({ storeId: search.storeId }),
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { storeId } = Route.useSearch();
	const { categoryId, itemId } = Route.useParams();
	const { item, initialOptionGroupIds } = Route.useLoaderData();
	const { t } = useTranslation("menu");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();

	// Fetch the latest item data
	const { data: currentItem } = useQuery({
		...trpc.menu.items.getById.queryOptions({ id: itemId }),
		initialData: item,
	});

	if (!currentItem) {
		return null;
	}

	const { data: store } = useQuery({
		...trpc.store.getById.queryOptions({ storeId: currentItem.storeId }),
	});
	const { data: categories = [] } = useQuery(
		getCategoriesQueryOptions(trpc, trpcClient, currentItem.storeId),
	);
	const { data: category } = useQuery({
		...trpc.menu.categories.getById.queryOptions({ id: categoryId }),
	});

	if (!store || !category) {
		return null;
	}

	const language = "de";
	const categoryName = getDisplayName(category.translations, language);
	const itemName = getDisplayName(currentItem.translations, language);

	return (
		<div className="space-y-6">
			<PageActionBar
				breadcrumbs={[
					{ label: t("titles.categories"), href: "/menu", search: { storeId } },
					{
						label: categoryName || t("emptyStates.unnamed"),
						href: `/menu/categories/${categoryId}`,
						search: { storeId },
					},
					{ label: itemName || t("emptyStates.unnamed") },
				]}
			/>

			<ItemForm
				item={currentItem}
				categories={categories}
				categoryId={categoryId}
				storeId={currentItem.storeId}
				merchantId={store.merchantId}
				initialOptionGroupIds={initialOptionGroupIds}
			/>
		</div>
	);
}
