import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ConsoleError } from "@/features/console/components/console-error";
import { MenuPage } from "@/features/console/menu/components/menu-page";
import { MenuPageSkeleton } from "@/features/console/menu/components/skeletons";
import { optionGroupQueries } from "@/features/console/menu/options.queries";
import { categoryQueries, itemQueries } from "@/features/console/menu/queries";
import { storeQueries } from "@/features/console/stores/queries";

const tabSchema = z.enum([
	"categories",
	"items",
	"options",
	"translations",
	"import",
]);

const searchSchema = z.object({
	storeId: z.string().optional(),
	tab: tabSchema.optional().default("categories"),
	selected: z.string().optional(),
});

export const Route = createFileRoute("/console/menu/")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ storeId: search.storeId }),
	loader: async ({ context, deps }) => {
		const stores = await context.queryClient.ensureQueryData(
			storeQueries.list(),
		);

		// Auto-select if single store, otherwise use URL param
		const effectiveStoreId =
			deps.storeId ?? (stores.length === 1 ? stores[0].id : undefined);

		if (effectiveStoreId) {
			await Promise.all([
				context.queryClient.ensureQueryData(
					categoryQueries.byStore(effectiveStoreId),
				),
				context.queryClient.ensureQueryData(
					itemQueries.byStore(effectiveStoreId),
				),
				context.queryClient.ensureQueryData(
					optionGroupQueries.byStore(effectiveStoreId),
				),
			]);
		}

		return {
			stores,
			autoSelectedStoreId: stores.length === 1 ? stores[0].id : undefined,
		};
	},
	component: RouteComponent,
	pendingComponent: MenuPageSkeleton,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const search = Route.useSearch();
	const loaderData = Route.useLoaderData();
	return <MenuPage search={search} loaderData={loaderData} />;
}
