import type { AppRouter } from "@menuvo/api/trpc";
import { useNavigate } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import type { OrderStatus } from "@/features/orders";
import type { DateRangePreset } from "@/features/orders/types";
import { OrdersTable } from "./orders-table";

type RouterOutput = inferRouterOutputs<AppRouter>;
type StoreType = RouterOutput["store"]["list"][number];

interface OrdersPageProps {
	search: {
		storeId: string;
		status?: OrderStatus;
		search?: string;
		days: DateRangePreset;
	};
	loaderData: {
		stores: StoreType[];
		autoSelectedStoreId?: string;
	};
}

export function OrdersPage({ search, loaderData }: OrdersPageProps) {
	const { t } = useTranslation("console-orders");
	const navigate = useNavigate();

	const storeId = search.storeId;

	const handleStatusChange = (status: OrderStatus | undefined) => {
		navigate({
			to: "/stores/$storeId/orders",
			params: { storeId },
			search: { status, search: search.search, days: search.days },
		});
	};

	const handleSearchChange = (searchTerm: string | undefined) => {
		navigate({
			to: "/stores/$storeId/orders",
			params: { storeId },
			search: { status: search.status, search: searchTerm, days: search.days },
		});
	};

	const handleDaysChange = (days: DateRangePreset) => {
		navigate({
			to: "/stores/$storeId/orders",
			params: { storeId },
			search: { status: search.status, search: search.search, days },
		});
	};

	// No stores available
	if (loaderData.stores.length === 0) {
		return (
			<div className="flex h-full flex-col">
				<PageActionBar title={t("title")} />
				<div className="flex flex-1 items-center justify-center">
					<div className="flex flex-col items-center gap-2 text-muted-foreground">
						<Store className="size-12" />
						<p>No stores available</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<PageActionBar title={t("title")} />

			<div className="mt-4 min-h-0 flex-1">
				<OrdersTable
					storeId={storeId}
					statusFilter={search.status}
					searchFilter={search.search}
					daysFilter={search.days}
					onStatusChange={handleStatusChange}
					onSearchChange={handleSearchChange}
					onDaysChange={handleDaysChange}
				/>
			</div>
		</div>
	);
}
