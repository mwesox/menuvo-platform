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
	"/_app/menu/categories/$categoryId/items/new",
)({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ storeId: search.storeId }),
	loader: async ({ deps, params }) => {
		await Promise.all([
			queryClient.ensureQueryData(
				getCategoriesQueryOptions(trpc, trpcClient, deps.storeId),
			),
			trpcUtils.store.getById.ensureData({ storeId: deps.storeId }),
			trpcUtils.menu.categories.getById.ensureData({ id: params.categoryId }),
		]);
	},
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { storeId } = Route.useSearch();
	const { categoryId } = Route.useParams();
	const { t } = useTranslation("menu");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();

	const { data: categories = [] } = useQuery(
		getCategoriesQueryOptions(trpc, trpcClient, storeId),
	);
	const { data: store } = useQuery({
		...trpc.store.getById.queryOptions({ storeId }),
	});
	const { data: category } = useQuery({
		...trpc.menu.categories.getById.queryOptions({ id: categoryId }),
	});

	if (!store || !category) {
		return null;
	}

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
