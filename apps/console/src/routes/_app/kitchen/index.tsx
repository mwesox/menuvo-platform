/**
 * Kitchen Monitor route - kanban board for order management.
 *
 * URL params:
 * - storeId: Selected store (optional if single store)
 */

import type { AppRouter } from "@menuvo/api/trpc";
import { createFileRoute } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { z } from "zod/v4";
import { ConsoleError } from "@/features/components/console-error";
import { KitchenPage } from "@/features/kitchen/components/kitchen-page";
import { trpcUtils } from "@/lib/trpc";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Store = RouterOutput["store"]["list"][number];

const searchSchema = z.object({
	storeId: z.string().optional(),
});

export const Route = createFileRoute("/_app/kitchen/")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({
		storeId: search.storeId,
	}),
	loader: async ({ deps }) => {
		// Load stores
		const stores = (await trpcUtils.store.list.ensureData()) as Store[];

		// Auto-select store if only one
		const effectiveStoreId =
			deps.storeId ?? (stores.length === 1 ? stores[0]?.id : undefined);

		// Prefetch orders if store selected
		if (effectiveStoreId) {
			await Promise.all([
				trpcUtils.order.listForKitchen.ensureData({
					storeId: effectiveStoreId,
					limit: 50,
				}),
				trpcUtils.order.kitchenDone.ensureData({
					storeId: effectiveStoreId,
					limit: 20,
				}),
			]);
		}

		return {
			stores,
			autoSelectedStoreId: stores.length === 1 ? stores[0]?.id : undefined,
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
