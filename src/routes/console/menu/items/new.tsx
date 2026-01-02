import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { NewItemPage } from "@/features/console/menu/components/new-item-page";
import { DisplayLanguageProvider } from "@/features/console/menu/contexts/display-language-context";
import { categoryQueries } from "@/features/console/menu/queries";
import { merchantQueries } from "@/features/console/settings/queries";
import { storeQueries } from "@/features/console/stores/queries";

const MERCHANT_ID = 1;

const searchSchema = z.object({
	categoryId: z.number().optional(),
	storeId: z.number(),
});

export const Route = createFileRoute("/console/menu/items/new")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ storeId: search.storeId }),
	loader: async ({ context, deps }) => {
		const [, , merchant] = await Promise.all([
			context.queryClient.ensureQueryData(
				categoryQueries.byStore(deps.storeId),
			),
			context.queryClient.ensureQueryData(storeQueries.detail(deps.storeId)),
			context.queryClient.ensureQueryData(merchantQueries.detail(MERCHANT_ID)),
		]);
		return {
			displayLanguage: merchant.supportedLanguages?.[0] ?? "de",
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { categoryId: initialCategoryId, storeId } = Route.useSearch();
	const { displayLanguage } = Route.useLoaderData();

	const { data: categories = [] } = useSuspenseQuery(
		categoryQueries.byStore(storeId),
	);
	const { data: store } = useSuspenseQuery(storeQueries.detail(storeId));

	return (
		<DisplayLanguageProvider language={displayLanguage}>
			<NewItemPage
				storeId={storeId}
				initialCategoryId={initialCategoryId ?? null}
				categories={categories}
				merchantId={store.merchantId}
			/>
		</DisplayLanguageProvider>
	);
}
