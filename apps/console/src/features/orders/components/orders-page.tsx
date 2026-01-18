import type { AppRouter } from "@menuvo/api/trpc";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@menuvo/ui";
import { useNavigate } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import type { OrderStatus } from "@/features/orders";
import type { DateRangePreset } from "@/routes/_app/orders";
import { OrdersTable } from "./orders-table";

type RouterOutput = inferRouterOutputs<AppRouter>;
type StoreType = RouterOutput["store"]["list"][number];

interface OrdersPageProps {
	search: {
		storeId?: string;
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

	const effectiveStoreId = search.storeId ?? loaderData.autoSelectedStoreId;
	const hasMultipleStores = loaderData.stores.length > 1;

	const handleStoreChange = (storeId: string) => {
		navigate({
			to: "/orders",
			search: {
				storeId,
				status: search.status,
				search: search.search,
				days: search.days,
			},
		});
	};

	const handleStatusChange = (status: OrderStatus | undefined) => {
		navigate({
			to: "/orders",
			search: { ...search, status },
		});
	};

	const handleSearchChange = (searchTerm: string | undefined) => {
		navigate({
			to: "/orders",
			search: { ...search, search: searchTerm },
		});
	};

	const handleDaysChange = (days: DateRangePreset) => {
		navigate({
			to: "/orders",
			search: { ...search, days },
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
			<PageActionBar
				title={t("title")}
				actions={
					hasMultipleStores ? (
						<Select
							value={effectiveStoreId?.toString()}
							onValueChange={handleStoreChange}
						>
							<SelectTrigger className="w-[200px]">
								<SelectValue placeholder="Select store" />
							</SelectTrigger>
							<SelectContent>
								{loaderData.stores.map((store) => (
									<SelectItem key={store.id} value={store.id.toString()}>
										{store.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : null
				}
			/>

			{effectiveStoreId ? (
				<div className="mt-4 min-h-0 flex-1">
					<OrdersTable
						storeId={effectiveStoreId}
						statusFilter={search.status}
						searchFilter={search.search}
						daysFilter={search.days}
						onStatusChange={handleStatusChange}
						onSearchChange={handleSearchChange}
						onDaysChange={handleDaysChange}
					/>
				</div>
			) : (
				<div className="flex flex-1 items-center justify-center text-muted-foreground">
					{t("selectOrder")}
				</div>
			)}
		</div>
	);
}
