import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import type { Item, Store } from "@/db/schema";
import { ConsoleError } from "@/features/console/components/console-error";
import {
	type CategoryWithItems,
	ItemForm,
} from "@/features/console/menu/components/item-form";
import { ItemFormSkeleton } from "@/features/console/menu/components/skeletons";
import { useEntityDisplayName } from "@/features/console/menu/hooks";
import { itemOptionQueries } from "@/features/console/menu/options.queries";
import { categoryQueries, itemQueries } from "@/features/console/menu/queries";
import { storeQueries } from "@/features/console/stores/queries";

export const Route = createFileRoute("/console/menu/items/$itemId")({
	loader: async ({ context, params }) => {
		const itemId = params.itemId;
		const [item, itemOptions] = await Promise.all([
			context.queryClient.ensureQueryData(itemQueries.detail(itemId)),
			context.queryClient.ensureQueryData(itemOptionQueries.byItem(itemId)),
		]);
		// Prefetch store and categories data
		await Promise.all([
			context.queryClient.ensureQueryData(storeQueries.detail(item.storeId)),
			context.queryClient.ensureQueryData(
				categoryQueries.byStore(item.storeId),
			),
		]);
		return {
			initialOptionGroupIds: itemOptions.map((og) => og.id),
		};
	},
	component: EditItemPage,
	pendingComponent: ItemFormSkeleton,
	errorComponent: ConsoleError,
});

function EditItemPage() {
	const { itemId } = Route.useParams();
	const { initialOptionGroupIds } = Route.useLoaderData();
	const { data: item } = useSuspenseQuery(itemQueries.detail(itemId));
	const { data: store } = useSuspenseQuery(storeQueries.detail(item.storeId));
	const { data: categories = [] } = useSuspenseQuery(
		categoryQueries.byStore(item.storeId),
	);

	return (
		<EditItemPageContent
			item={item}
			store={store}
			categories={categories}
			initialOptionGroupIds={initialOptionGroupIds}
		/>
	);
}

function EditItemPageContent({
	item,
	store,
	categories,
	initialOptionGroupIds,
}: {
	item: Item;
	store: Store;
	categories: CategoryWithItems[];
	initialOptionGroupIds: string[];
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
				categories={categories}
				categoryId={item.categoryId}
				storeId={item.storeId}
				merchantId={store.merchantId}
				initialOptionGroupIds={initialOptionGroupIds}
			/>
		</div>
	);
}
