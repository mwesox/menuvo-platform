import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ConsoleError } from "@/features/console/components/console-error";
import { CategoryItemsPage } from "@/features/console/menu/components/category-items-page";
import { CategoryItemsPageSkeleton } from "@/features/console/menu/components/skeletons";
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
	pendingComponent: CategoryItemsPageSkeleton,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { categoryId } = Route.useParams();
	const { storeId } = Route.useSearch();
	const categoryIdNum = Number.parseInt(categoryId, 10);

	return <CategoryItemsPage categoryId={categoryIdNum} storeId={storeId} />;
}
