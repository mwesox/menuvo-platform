import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ConsoleError } from "@/features/console/components/console-error";
import { ItemForm } from "@/features/console/menu/components/item-form";
import { MenuBreadcrumb } from "@/features/console/menu/components/menu-breadcrumb";
import { getDisplayName } from "@/features/console/menu/logic/display";
import { itemOptionQueries } from "@/features/console/menu/options.queries";
import { categoryQueries, itemQueries } from "@/features/console/menu/queries";
import { storeQueries } from "@/features/console/stores/queries";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute(
	"/console/menu/categories/$categoryId/items/$itemId",
)({
	validateSearch: searchSchema,
	loader: async ({ context, params }) => {
		const [item, itemOptions] = await Promise.all([
			context.queryClient.ensureQueryData(itemQueries.detail(params.itemId)),
			context.queryClient.ensureQueryData(
				itemOptionQueries.byItem(params.itemId),
			),
		]);

		await Promise.all([
			context.queryClient.ensureQueryData(storeQueries.detail(item.storeId)),
			context.queryClient.ensureQueryData(
				categoryQueries.byStore(item.storeId),
			),
			context.queryClient.ensureQueryData(
				categoryQueries.detail(params.categoryId),
			),
		]);

		return {
			initialOptionGroupIds: itemOptions.map((og) => og.id),
		};
	},
	loaderDeps: ({ search }) => ({ storeId: search.storeId }),
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { storeId } = Route.useSearch();
	const { categoryId, itemId } = Route.useParams();
	const { initialOptionGroupIds } = Route.useLoaderData();
	const { t } = useTranslation("menu");

	const { data: item } = useSuspenseQuery(itemQueries.detail(itemId));
	const { data: store } = useSuspenseQuery(storeQueries.detail(item.storeId));
	const { data: categories = [] } = useSuspenseQuery(
		categoryQueries.byStore(item.storeId),
	);
	const { data: category } = useSuspenseQuery(
		categoryQueries.detail(categoryId),
	);

	const language = "de";
	const categoryName = getDisplayName(category.translations, language);
	const itemName = getDisplayName(item.translations, language);

	return (
		<div className="space-y-6">
			<MenuBreadcrumb
				storeId={storeId}
				category={{ id: categoryId, name: categoryName }}
				item={{ id: itemId, name: itemName }}
			/>

			<div>
				<h1 className="font-semibold text-2xl tracking-tight">
					{t("pageHeaders.editItemTitle")}
				</h1>
				<p className="text-muted-foreground">
					{t("pageHeaders.editItemDescription", { itemName })}
				</p>
			</div>

			<ItemForm
				item={item}
				categories={categories}
				categoryId={categoryId}
				storeId={item.storeId}
				merchantId={store.merchantId}
				initialOptionGroupIds={initialOptionGroupIds}
			/>
		</div>
	);
}
