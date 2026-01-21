import { VStack } from "@chakra-ui/react";
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
	"/_app/stores/$storeId/menu/categories/$categoryId/items/new",
)({
	loader: async ({ params }) => {
		await Promise.all([
			queryClient.ensureQueryData(
				getCategoriesQueryOptions(trpc, trpcClient, params.storeId),
			),
			trpcUtils.menu.categories.getById.ensureData({ id: params.categoryId }),
		]);
	},
	component: NewItemPage,
	errorComponent: ConsoleError,
});

function NewItemPage() {
	const store = useStore();
	const { categoryId } = Route.useParams();
	const { t } = useTranslation("menu");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();

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

	return (
		<VStack gap="6" align="stretch">
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
					{ label: t("titles.addItem") },
				]}
			/>

			<ItemForm
				categories={categories}
				categoryId={categoryId}
				storeId={store.id}
				merchantId={store.merchantId}
			/>
		</VStack>
	);
}
