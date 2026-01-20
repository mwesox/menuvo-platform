import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod/v4";
import { ConsoleError } from "@/features/components/console-error";
import { AiRecommendationsPage } from "@/features/settings/components/ai-recommendations/ai-recommendations-page";
import { AiRecommendationsPageSkeleton } from "@/features/settings/components/ai-recommendations/ai-recommendations-skeleton";

const searchSchema = z.object({
	storeId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/_app/settings/ai-recommendations")({
	validateSearch: searchSchema,
	beforeLoad: async ({ context, search }) => {
		// If no storeId provided, get stores and redirect with first store
		if (!search.storeId) {
			const stores = await context.trpcClient.store.list.query();
			if (stores.length > 0) {
				throw redirect({
					to: "/settings/ai-recommendations",
					search: { storeId: stores[0]?.id },
					replace: true,
				});
			}
		}
	},
	component: RouteComponent,
	pendingComponent: AiRecommendationsPageSkeleton,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { storeId } = Route.useSearch();

	if (!storeId) {
		// Should not happen due to beforeLoad redirect, but handle gracefully
		return null;
	}

	return <AiRecommendationsPage storeId={storeId} />;
}
