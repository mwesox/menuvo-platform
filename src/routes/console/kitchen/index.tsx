/**
 * Kitchen Monitor route - kanban board for order management.
 *
 * URL params:
 * - storeId: Selected store (optional if single store)
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ConsoleError } from "@/features/console/components/console-error";
import { KitchenPage } from "@/features/console/kitchen/components/kitchen-page";
import { storeQueries } from "@/features/console/stores/queries";
import { orderQueries } from "@/features/orders/queries";

const searchSchema = z.object({
	storeId: z.string().optional(),
});

export const Route = createFileRoute("/console/kitchen/")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({
		storeId: search.storeId,
	}),
	loader: async ({ context, deps }) => {
		// Load stores
		const stores = await context.queryClient.ensureQueryData(
			storeQueries.list(),
		);

		// Auto-select store if only one
		const effectiveStoreId =
			deps.storeId ?? (stores.length === 1 ? stores[0].id : undefined);

		// Prefetch orders if store selected
		if (effectiveStoreId) {
			await Promise.all([
				context.queryClient.ensureQueryData(
					orderQueries.kitchen(effectiveStoreId),
				),
				context.queryClient.ensureQueryData(
					orderQueries.kitchenDone(effectiveStoreId),
				),
			]);
		}

		return {
			stores,
			autoSelectedStoreId: stores.length === 1 ? stores[0].id : undefined,
		};
	},
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const search = Route.useSearch();
	const loaderData = Route.useLoaderData();
	return <KitchenPage search={search} loaderData={loaderData} />;
}
