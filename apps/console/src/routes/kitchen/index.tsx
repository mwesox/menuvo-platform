/**
 * Kitchen Monitor route - kanban board for order management.
 *
 * URL params:
 * - storeId: Selected store (optional if single store)
 */

import type { Store } from "@menuvo/db/schema";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ConsoleError } from "@/features/components/console-error";
import { KitchenPage } from "@/features/kitchen/components/kitchen-page";
import { orderQueries } from "@/features/orders/queries";
import { trpc } from "@/lib/trpc";

const searchSchema = z.object({
	storeId: z.string().optional(),
});

export const Route = createFileRoute("/kitchen/")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({
		storeId: search.storeId,
	}),
	loader: async ({ context, deps }) => {
		// Load stores
		const stores = (await context.queryClient.ensureQueryData(
			trpc.store.list.queryOptions(),
		)) as Store[];

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
