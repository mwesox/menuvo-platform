import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { ConsoleError } from "@/features/components/console-error";
import { ItemForm } from "@/features/menu/components/item-form";
import { getDisplayName } from "@/features/menu/logic/display";
import { categoryQueries } from "@/features/menu/queries";
import { storeQueries } from "@/features/stores/queries";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute("/menu/categories/$categoryId/items/new")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ storeId: search.storeId }),
	loader: async ({ context, deps, params }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(
				categoryQueries.byStore(deps.storeId),
			),
			context.queryClient.ensureQueryData(storeQueries.detail(deps.storeId)),
			context.queryClient.ensureQueryData(
				categoryQueries.detail(params.categoryId),
			),
		]);
	},
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { storeId } = Route.useSearch();
	const { categoryId } = Route.useParams();
	const { t } = useTranslation("menu");

	const { data: categories = [] } = useSuspenseQuery(
		categoryQueries.byStore(storeId),
	);
	const { data: store } = useSuspenseQuery(storeQueries.detail(storeId));
	const { data: category } = useSuspenseQuery(
		categoryQueries.detail(categoryId),
	);

	const language = "de";
	const categoryName = getDisplayName(category.translations, language);

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
					{ label: t("titles.addItem") },
				]}
			/>

			<ItemForm
				categories={categories}
				categoryId={categoryId}
				storeId={storeId}
				merchantId={store.merchantId}
			/>
		</div>
	);
}
