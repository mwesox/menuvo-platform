import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod/v4";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import type { OrderStatus } from "@/features/orders";
import { OrdersPage } from "@/features/orders/components/orders-page";
import {
	type DateRangePreset,
	dateRangePresets,
} from "@/features/orders/types";
import { trpcUtils } from "@/lib/trpc";

const searchSchema = z.object({
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
	date.setHours(0, 0, 0, 0);
	return date.toISOString();
}

export const Route = createFileRoute("/_app/stores/$storeId/orders/")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({
		status: search.status,
		search: search.search,
		days: search.days,
	}),
	loader: async ({ params, deps }) => {
		const fromDate = getFromDate(deps.days);

		await trpcUtils.order.listByStore.ensureData({
			storeId: params.storeId,
			status: deps.status as OrderStatus | undefined,
			startDate: fromDate ? new Date(fromDate) : undefined,
			limit: 50,
		});
	},
	component: OrdersRoutePage,
	errorComponent: ConsoleError,
});

function OrdersRoutePage() {
	const search = Route.useSearch();
	const store = useStore();

	return (
		<OrdersPage
			search={{ ...search, storeId: store.id }}
			loaderData={{
				stores: [store],
				autoSelectedStoreId: store.id,
			}}
		/>
	);
}
