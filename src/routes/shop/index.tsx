import { createFileRoute } from "@tanstack/react-router";
import {
	DiscoveryPage,
	DiscoveryPageError,
	DiscoveryPageSkeleton,
} from "@/features/shop/discovery";
import { shopQueries } from "@/features/shop/queries";

export const Route = createFileRoute("/shop/")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(shopQueries.stores());
	},
	component: DiscoveryPage,
	pendingComponent: DiscoveryPageSkeleton,
	errorComponent: DiscoveryPageError,
});
