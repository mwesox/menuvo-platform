import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CategoryItemsPage } from "@/features/console/menu/components/category-items-page";
import { categoryQueries } from "@/features/console/menu/queries";

const searchSchema = z.object({
	storeId: z.number(),
});

export const Route = createFileRoute("/console/menu/categories/$categoryId")({
	validateSearch: searchSchema,
	loader: async ({ context, params }) => {
		const categoryId = Number.parseInt(params.categoryId, 10);
		await context.queryClient.ensureQueryData(
			categoryQueries.detail(categoryId),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { categoryId } = Route.useParams();
	const { storeId } = Route.useSearch();
	const categoryIdNum = Number.parseInt(categoryId, 10);

	return <CategoryItemsPage categoryId={categoryIdNum} storeId={storeId} />;
}
