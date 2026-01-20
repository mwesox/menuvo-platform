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
		<div className="space-y-6">
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
					{ label: t("titles.editCategory") },
				]}
			/>
			<CategoryForm storeId={store.id} category={category} />
		</div>
	);
}
