import { createFileRoute } from "@tanstack/react-router";
import {
	DiscoveryHeader,
	DiscoveryPage,
	DiscoveryPageError,
	DiscoveryPageSkeleton,
} from "@/features/shop/discovery";
import { ShopFooter } from "@/features/shop/layout";
import { shopQueries } from "@/features/shop/queries";

export const Route = createFileRoute("/shop/")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(shopQueries.stores());
	},
	component: DiscoveryLayout,
	pendingComponent: DiscoveryLayoutSkeleton,
	errorComponent: DiscoveryPageError,
});

function DiscoveryLayout() {
	return (
		<>
			<DiscoveryHeader />
			<main className="flex-1">
				<DiscoveryPage />
			</main>
			<ShopFooter />
		</>
	);
}

function DiscoveryLayoutSkeleton() {
	return (
		<>
			<DiscoveryHeader />
			<main className="flex-1">
				<DiscoveryPageSkeleton />
			</main>
			<ShopFooter />
		</>
	);
}
