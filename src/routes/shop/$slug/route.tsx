import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { z } from "zod";
import { shopQueries } from "@/features/shop/queries";
import { StoreError, StoreNotFound } from "@/features/shop/shared";

const searchSchema = z.object({
	sp: z.string().optional(),
});

export const Route = createFileRoute("/shop/$slug")({
	validateSearch: searchSchema,
	loader: async ({ context, params }) => {
		const store = await context.queryClient.ensureQueryData(
			shopQueries.storeBySlug(params.slug),
		);
		if (!store) {
			throw notFound();
		}
		return store;
	},
	component: StoreSlugLayout,
	notFoundComponent: StoreNotFound,
	errorComponent: StoreError,
});

function StoreSlugLayout() {
	return <Outlet />;
}
