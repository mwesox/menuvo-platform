import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import type { Item, Store } from "@/db/schema";
import { ItemForm } from "@/features/console/menu/components/item-form";
import { DisplayLanguageProvider } from "@/features/console/menu/contexts/display-language-context";
import { useEntityDisplayName } from "@/features/console/menu/hooks";
import { itemOptionQueries } from "@/features/console/menu/options.queries";
import { itemQueries } from "@/features/console/menu/queries";
import { storeQueries } from "@/features/console/stores/queries";

export const Route = createFileRoute("/console/menu/items/$itemId")({
	loader: async ({ context, params }) => {
		const itemId = Number.parseInt(params.itemId, 10);
		const [item, itemOptions] = await Promise.all([
			context.queryClient.ensureQueryData(itemQueries.detail(itemId)),
			context.queryClient.ensureQueryData(itemOptionQueries.byItem(itemId)),
		]);
		// Prefetch store data
		await context.queryClient.ensureQueryData(
			storeQueries.detail(item.storeId),
		);
		return {
			initialOptionGroupIds: itemOptions.map((og) => og.id),
			displayLanguage: context.displayLanguage,
		};
	},
	component: EditItemPage,
});

function EditItemPage() {
	const { itemId } = Route.useParams();
	const { initialOptionGroupIds, displayLanguage } = Route.useLoaderData();
	const itemIdNum = Number.parseInt(itemId, 10);
	const { data: item } = useSuspenseQuery(itemQueries.detail(itemIdNum));
	const { data: store } = useSuspenseQuery(storeQueries.detail(item.storeId));

	return (
		<DisplayLanguageProvider language={displayLanguage}>
			<EditItemPageContent
				item={item}
				store={store}
				initialOptionGroupIds={initialOptionGroupIds}
			/>
		</DisplayLanguageProvider>
	);
}

function EditItemPageContent({
	item,
	store,
	initialOptionGroupIds,
}: {
	item: Item;
	store: Store;
	initialOptionGroupIds: number[];
}) {
	const { t } = useTranslation("menu");
	const displayName = useEntityDisplayName(item.translations);

	return (
		<div className="space-y-6">
			<PageActionBar
				backHref={`/console/menu?storeId=${item.storeId}&tab=items`}
				backLabel={displayName || t("navigation.backToItems")}
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
