import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StoreProvider } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { trpcUtils, useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_app/stores/$storeId")({
	loader: async ({ params }) => {
		// Prefetch store data for initial load
		await trpcUtils.store.getWithDetails.ensureData({
			storeId: params.storeId,
		});
	},
	component: StoreLayout,
	errorComponent: ConsoleError,
});

/**
 * Layout route that provides store context to all child routes.
 * All routes under /stores/:storeId automatically have access to useStore().
 * Uses useSuspenseQuery to subscribe to cache updates when store is mutated.
 */
function StoreLayout() {
	const { storeId } = Route.useParams();
	const trpc = useTRPC();

	// useSuspenseQuery subscribes to cache - updates when mutations invalidate
	const { data: store } = useSuspenseQuery(
		trpc.store.getWithDetails.queryOptions({ storeId }),
	);

	return (
		<StoreProvider store={store}>
			<Outlet />
		</StoreProvider>
	);
}
