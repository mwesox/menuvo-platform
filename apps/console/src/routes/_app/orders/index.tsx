import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod/v4";
import { ConsoleError } from "@/features/components/console-error";
import type { OrderStatus } from "@/features/orders";
import { OrdersPage } from "@/features/orders/components/orders-page";
import { trpcUtils } from "@/lib/trpc";

// Date range presets in days
export const dateRangePresets = ["7", "30", "90", "all"] as const;
export type DateRangePreset = (typeof dateRangePresets)[number];

const searchSchema = z.object({
	storeId: z.string().optional(),
	status: z
		.enum([
			"awaiting_payment",
			"confirmed",
			"preparing",
			"ready",
			"completed",
			"cancelled",
		])
		.optional(),
	search: z.string().optional(),
	days: z.enum(dateRangePresets).default("30"),
});

/** Calculate fromDate based on days preset - normalized to start of day for stable query keys */
function getFromDate(days: DateRangePreset): string | undefined {
	if (days === "all") return undefined;
	const daysNum = Number.parseInt(days, 10);
	const date = new Date();
	date.setDate(date.getDate() - daysNum);
	date.setHours(0, 0, 0, 0); // Normalize to start of day
	return date.toISOString();
}

export const Route = createFileRoute("/_app/orders/")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({
		storeId: search.storeId,
		status: search.status,
		search: search.search,
		days: search.days,
	}),
	loader: async ({ deps }) => {
		const stores = await trpcUtils.store.list.ensureData();

		const effectiveStoreId =
			deps.storeId ?? (stores.length === 1 ? stores[0]?.id : undefined);

		const fromDate = getFromDate(deps.days);

		if (effectiveStoreId) {
			await trpcUtils.order.listByStore.ensureData({
				storeId: effectiveStoreId,
				status: deps.status as OrderStatus | undefined,
				startDate: fromDate ? new Date(fromDate) : undefined,
				limit: 50,
			});
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
	return <OrdersPage search={search} loaderData={loaderData} />;
}
