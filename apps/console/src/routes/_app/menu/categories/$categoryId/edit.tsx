import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { ConsoleError } from "@/features/components/console-error";
import { CategoryForm } from "@/features/menu/components/category-form";
import { getDisplayName } from "@/features/menu/logic/display";
import { trpcUtils } from "@/lib/trpc";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute("/_app/menu/categories/$categoryId/edit")({
	validateSearch: searchSchema,
	loader: async ({ params }) => {
		const category = await trpcUtils.menu.categories.getById.ensureData({
			id: params.categoryId,
		});
		return category;
	},
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { storeId } = Route.useSearch();
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
					{ label: t("titles.categories"), href: "/menu", search: { storeId } },
					{
						label: categoryName || t("emptyStates.unnamed"),
						href: `/menu/categories/${categoryId}`,
						search: { storeId },
					},
					{ label: t("titles.editCategory") },
				]}
			/>
			<CategoryForm storeId={storeId} category={category} />
		</div>
	);
}
