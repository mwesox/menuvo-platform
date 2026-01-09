import type { Store as StoreType } from "@menuvo/db/schema";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@menuvo/ui";
import { useNavigate } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MasterDetailLayout } from "@/components/layout/master-detail-layout";
import { PageActionBar } from "@/components/layout/page-action-bar";
import type { OrderStatus } from "@/features/orders";
import type { DateRangePreset } from "@/routes/orders";
import { OrderDetail } from "./order-detail";
import { OrdersList } from "./orders-list";

interface OrdersPageProps {
	search: {
		storeId?: string;
		selected?: string;
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
			},
		});
	};

	const handleSelectOrder = (orderId: string) => {
		navigate({
			to: "/orders",
			search: { ...search, selected: orderId },
		});
	};

	const handleCloseDetail = () => {
		navigate({
			to: "/orders",
			search: { ...search, selected: undefined },
		});
	};

	const handleStatusChange = (status: OrderStatus | undefined) => {
		navigate({
			to: "/orders",
			search: { ...search, status, selected: undefined },
		});
	};

	const handleSearchChange = (searchTerm: string | undefined) => {
		navigate({
			to: "/orders",
			search: { ...search, search: searchTerm, selected: undefined },
		});
	};

	const handleDaysChange = (days: DateRangePreset) => {
		navigate({
			to: "/orders",
			search: { ...search, days, selected: undefined },
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
					<MasterDetailLayout
						masterWidth="wide"
						hasSelection={!!search.selected}
						onDetailClose={handleCloseDetail}
						sheetTitle={
							search.selected
								? t("orderNumber", { id: search.selected })
								: undefined
						}
						master={
							<OrdersList
								storeId={effectiveStoreId}
								selectedOrderId={search.selected}
								statusFilter={search.status}
								searchFilter={search.search}
								daysFilter={search.days}
								onSelectOrder={handleSelectOrder}
								onStatusChange={handleStatusChange}
								onSearchChange={handleSearchChange}
								onDaysChange={handleDaysChange}
							/>
						}
						detail={
							search.selected ? (
								<OrderDetail orderId={search.selected} />
							) : (
								<div className="flex h-full items-center justify-center text-muted-foreground">
									{t("selectOrder")}
								</div>
							)
						}
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
