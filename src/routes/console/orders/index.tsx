import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ConsoleError } from "@/features/console/components/console-error";
import { OrdersPage } from "@/features/console/orders/components/orders-page";
import { storeQueries } from "@/features/console/stores/queries";
import { type OrderStatus, orderQueries } from "@/features/orders";

// Date range presets in days
export const dateRangePresets = ["7", "30", "90", "all"] as const;
export type DateRangePreset = (typeof dateRangePresets)[number];

const searchSchema = z.object({
	storeId: z.string().optional(),
	selected: z.string().optional(),
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

export const Route = createFileRoute("/console/orders/")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({
		storeId: search.storeId,
		status: search.status,
		search: search.search,
		selected: search.selected,
		days: search.days,
	}),
	loader: async ({ context, deps }) => {
		const stores = await context.queryClient.ensureQueryData(
			storeQueries.list(),
		);

		const effectiveStoreId =
			deps.storeId ?? (stores.length === 1 ? stores[0].id : undefined);

		const fromDate = getFromDate(deps.days);

		if (effectiveStoreId) {
			await context.queryClient.ensureQueryData(
				orderQueries.byStore(effectiveStoreId, {
					status: deps.status as OrderStatus | undefined,
					search: deps.search,
					fromDate,
					limit: 50,
				}),
			);
		}

		// Prefetch selected order detail if provided
		if (deps.selected) {
			await context.queryClient.ensureQueryData(
				orderQueries.detail(deps.selected),
			);
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
	return <OrdersPage search={search} loaderData={loaderData} />;
}
