import { VStack } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { CategoryForm } from "@/features/menu/components/category-form";
import { getDisplayName } from "@/features/menu/logic/display";
import { trpcUtils } from "@/lib/trpc";

export const Route = createFileRoute(
	"/_app/stores/$storeId/menu/categories/$categoryId/edit",
)({
	loader: async ({ params }) => {
		const [category] = await Promise.all([
			trpcUtils.menu.categories.getById.ensureData({
				id: params.categoryId,
			}),
			// Prefetch VAT groups for the selector
			trpcUtils.menu.vat.list.ensureData(),
		]);
		return category;
	},
	component: EditCategoryPage,
	errorComponent: ConsoleError,
});

function EditCategoryPage() {
	const store = useStore();
	const { categoryId } = Route.useParams();
	const { t } = useTranslation("menu");
	const category = Route.useLoaderData();

	if (!category) {
		return null;
	}

	const categoryName = getDisplayName(category.translations, "de");

	return (
		<VStack gap="6" align="stretch">
			<PageActionBar
				breadcrumbs={[
					{
						label: t("titles.categories"),
						href: "/stores/$storeId/menu",
						params: { storeId: store.id },
					},
					{
						label: categoryName || t("emptyStates.unnamed"),
						href: "/stores/$storeId/menu/categories/$categoryId",
						params: { storeId: store.id, categoryId },
					},
					{ label: t("titles.editCategory") },
				]}
			/>
			<CategoryForm storeId={store.id} category={category} />
		</VStack>
	);
}
