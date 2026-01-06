import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	type OrderStatus,
	orderQueries,
	orderStatuses,
} from "@/features/orders";
import {
	type DateRangePreset,
	dateRangePresets,
} from "@/routes/console/orders";
import { ExportOrdersButton } from "./export-orders-button";
import { OrderListItem } from "./order-list-item";

interface OrdersListProps {
	storeId: number;
	selectedOrderId?: number;
	statusFilter?: OrderStatus;
	searchFilter?: string;
	daysFilter: DateRangePreset;
	onSelectOrder: (orderId: number) => void;
	onStatusChange: (status: OrderStatus | undefined) => void;
	onSearchChange: (search: string | undefined) => void;
	onDaysChange: (days: DateRangePreset) => void;
}

/** Calculate fromDate based on days preset - normalized to start of day for stable query keys */
function getFromDate(days: DateRangePreset): string | undefined {
	if (days === "all") return undefined;
	const daysNum = Number.parseInt(days, 10);
	const date = new Date();
	date.setDate(date.getDate() - daysNum);
	date.setHours(0, 0, 0, 0); // Normalize to start of day
	return date.toISOString();
}

const PAGE_SIZE = 50;

export function OrdersList({
	storeId,
	selectedOrderId,
	statusFilter,
	searchFilter,
	daysFilter,
	onSelectOrder,
	onStatusChange,
	onSearchChange,
	onDaysChange,
}: OrdersListProps) {
	const { t } = useTranslation("console-orders");
	const [localSearch, setLocalSearch] = useState(searchFilter ?? "");
	const [offset, setOffset] = useState(0);

	// React 19: useDeferredValue instead of custom useDebounce
	const deferredSearch = useDeferredValue(localSearch);
	const prevDeferredRef = useRef(deferredSearch);

	// Memoize fromDate to prevent query key instability
	const fromDate = useMemo(() => getFromDate(daysFilter), [daysFilter]);

	// Only sync to URL when deferred value actually changes
	useEffect(() => {
		if (prevDeferredRef.current !== deferredSearch) {
			prevDeferredRef.current = deferredSearch;
			onSearchChange(deferredSearch || undefined);
		}
	}, [deferredSearch, onSearchChange]);

	// Sync from URL if it changes externally (back button, shared link)
	// biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally exclude localSearch to prevent infinite loop
	useEffect(() => {
		const urlValue = searchFilter ?? "";
		if (urlValue !== localSearch) {
			setLocalSearch(urlValue);
		}
	}, [searchFilter]);

	const { data: orders, isLoading } = useQuery(
		orderQueries.byStore(storeId, {
			status: statusFilter,
			search: deferredSearch || undefined,
			fromDate,
			limit: PAGE_SIZE + offset,
			offset: 0,
		}),
	);

	const handleStatusFilterChange = (value: string) => {
		const status = value === "all" ? undefined : (value as OrderStatus);
		onStatusChange(status);
		setOffset(0);
	};

	const handleDaysFilterChange = (value: string) => {
		onDaysChange(value as DateRangePreset);
		setOffset(0);
	};

	const handleLoadMore = () => {
		setOffset((prev) => prev + PAGE_SIZE);
	};

	const hasMore = orders && orders.length === PAGE_SIZE + offset;

	if (isLoading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-10 w-full" />
				<div className="flex gap-2">
					<Skeleton className="h-10 w-[140px]" />
					<Skeleton className="h-10 flex-1" />
				</div>
				{Array.from({ length: 5 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton items
					<Skeleton key={i} className="h-20" />
				))}
			</div>
		);
	}

	const isEmpty = !orders || orders.length === 0;
	const isFiltered = statusFilter || deferredSearch || daysFilter !== "all";

	return (
		<div className="flex flex-col gap-3">
			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder={t("searchPlaceholder")}
					value={localSearch}
					onChange={(e) => {
						setLocalSearch(e.target.value);
						setOffset(0);
					}}
					className="ps-9"
				/>
			</div>

			{/* Filters row */}
			<div className="flex gap-2">
				<Select value={daysFilter} onValueChange={handleDaysFilterChange}>
					<SelectTrigger className="w-[140px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{dateRangePresets.map((preset) => (
							<SelectItem key={preset} value={preset}>
								{t(`dateRange.${preset}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={statusFilter ?? "all"}
					onValueChange={handleStatusFilterChange}
				>
					<SelectTrigger className="flex-1">
						<SelectValue placeholder={t("filterByStatus")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("allStatuses")}</SelectItem>
						{orderStatuses.map((status) => (
							<SelectItem key={status} value={status}>
								{t(`status.${status}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<ExportOrdersButton
					storeId={storeId}
					statusFilter={statusFilter}
					searchFilter={deferredSearch || undefined}
					fromDate={fromDate}
				/>
			</div>

			{/* Orders List */}
			{isEmpty ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<p className="text-lg font-medium">
						{isFiltered ? t("emptyFiltered.title") : t("empty.title")}
					</p>
					<p className="text-sm text-muted-foreground">
						{isFiltered
							? t("emptyFiltered.description")
							: t("empty.description")}
					</p>
				</div>
			) : (
				<>
					<div className="flex flex-col gap-2">
						{orders.map((order) => (
							<OrderListItem
								key={order.id}
								order={order}
								isSelected={order.id === selectedOrderId}
								onSelect={() => onSelectOrder(order.id)}
							/>
						))}
					</div>

					{hasMore && (
						<Button
							variant="outline"
							onClick={handleLoadMore}
							className="w-full"
						>
							{t("loadMore")}
						</Button>
					)}
				</>
			)}
		</div>
	);
}
