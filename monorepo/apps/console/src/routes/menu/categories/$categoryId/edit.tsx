import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ConsoleError } from "@/features/components/console-error";
import { CategoryForm } from "@/features/menu/components/category-form";
import { MenuBreadcrumb } from "@/features/menu/components/menu-breadcrumb";
import { getDisplayName } from "@/features/menu/logic/display";
import { categoryQueries } from "@/features/menu/queries";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute("/menu/categories/$categoryId/edit")({
	validateSearch: searchSchema,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			categoryQueries.detail(params.categoryId),
		);
	},
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { storeId } = Route.useSearch();
	const { categoryId } = Route.useParams();

	const { data: category } = useSuspenseQuery(
		categoryQueries.detail(categoryId),
	);

	const categoryName = getDisplayName(category.translations, "de");

	return (
		<div className="space-y-6">
			<MenuBreadcrumb
				storeId={storeId}
				category={{ id: categoryId, name: categoryName }}
				currentPage="Edit"
			/>
			<CategoryForm storeId={storeId} category={category} />
		</div>
	);
}
