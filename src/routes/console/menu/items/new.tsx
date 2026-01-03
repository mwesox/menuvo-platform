import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { NewItemPage } from "@/features/console/menu/components/new-item-page";
import { categoryQueries } from "@/features/console/menu/queries";
import { storeQueries } from "@/features/console/stores/queries";

const searchSchema = z.object({
	categoryId: z.number().optional(),
	storeId: z.number(),
});

export const Route = createFileRoute("/console/menu/items/new")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ storeId: search.storeId }),
	loader: async ({ context, deps }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(
				categoryQueries.byStore(deps.storeId),
			),
			context.queryClient.ensureQueryData(storeQueries.detail(deps.storeId)),
		]);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { categoryId: initialCategoryId, storeId } = Route.useSearch();

	const { data: categories = [] } = useSuspenseQuery(
		categoryQueries.byStore(storeId),
	);
	const { data: store } = useSuspenseQuery(storeQueries.detail(storeId));

	return (
		<NewItemPage
			storeId={storeId}
			initialCategoryId={initialCategoryId ?? null}
			categories={categories}
			merchantId={store.merchantId}
		/>
	);
}
