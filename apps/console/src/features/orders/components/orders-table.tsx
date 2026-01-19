import type { AppRouter } from "@menuvo/api/trpc";
import {
	Badge,
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@menuvo/ui";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	type OrderStatus,
	type OrderType,
	orderStatuses,
} from "@/features/orders";
import { formatPrice } from "@/features/orders/logic/order-pricing";
import type { OrderListItem } from "@/features/orders/types";
import { useTRPC } from "@/lib/trpc";
import { type DateRangePreset, dateRangePresets } from "@/routes/_app/orders";
import { ExportOrdersButton } from "./export-orders-button";

type RouterOutput = inferRouterOutputs<AppRouter>;
type OrderListResponse = RouterOutput["order"]["listByStore"];

interface OrdersTableProps {
	storeId: string;
	statusFilter?: OrderStatus;
	searchFilter?: string;
	daysFilter: DateRangePreset;
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

const statusVariants: Record<
	OrderStatus,
	"default" | "secondary" | "destructive" | "outline"
> = {
	awaiting_payment: "outline",
	confirmed: "default",
	preparing: "secondary",
	ready: "default",
	completed: "secondary",
	cancelled: "destructive",
};

const orderTypeVariants: Record<
	OrderType,
	"default" | "secondary" | "outline"
> = {
	dine_in: "outline",
	takeaway: "secondary",
	delivery: "default",
};

export function OrdersTable({
	storeId,
	statusFilter,
	searchFilter,
	daysFilter,
	onStatusChange,
	onSearchChange,
	onDaysChange,
}: OrdersTableProps) {
	const { t, i18n } = useTranslation("console-orders");
	const locale = i18n.language === "de" ? de : enUS;
	const navigate = useNavigate();
	const trpc = useTRPC();
	const [localSearch, setLocalSearch] = useState(searchFilter ?? "");

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
	useEffect(() => {
		const urlValue = searchFilter ?? "";
		if (urlValue !== localSearch) {
			setLocalSearch(urlValue);
		}
	}, [searchFilter]);

	const { data: ordersResponseData, isLoading } = useQuery(
		trpc.order.listByStore.queryOptions({
			storeId,
			status: statusFilter,
			startDate: fromDate ? new Date(fromDate) : undefined,
			limit: PAGE_SIZE,
		}),
	);
	const ordersResponse = ordersResponseData as OrderListResponse | undefined;

	// Client-side search filtering (API doesn't support search yet)
	const orders = useMemo(() => {
		const list = ordersResponse?.orders as OrderListItem[] | undefined;
		if (!list) return [];
		if (!deferredSearch) return list;
		const searchLower = deferredSearch.toLowerCase();
		return list.filter(
			(order) =>
				order.customerName?.toLowerCase().includes(searchLower) ||
				order.customerEmail?.toLowerCase().includes(searchLower) ||
				order.customerPhone?.toLowerCase().includes(searchLower) ||
				order.id.toLowerCase().includes(searchLower),
		);
	}, [ordersResponse?.orders, deferredSearch]);

	const handleStatusFilterChange = (value: string) => {
		const status = value === "all" ? undefined : (value as OrderStatus);
		onStatusChange(status);
	};

	const handleDaysFilterChange = (value: string) => {
		onDaysChange(value as DateRangePreset);
	};

	const handleRowClick = (orderId: string) => {
		navigate({
			to: "/orders/$orderId",
			params: { orderId },
			search: { storeId },
		});
	};

	const handleLoadMore = () => {
		// TODO: Implement cursor-based pagination
	};

	const hasMore = ordersResponse?.nextCursor != null;
	const isEmpty = !orders || orders.length === 0;
	const isFiltered = statusFilter || deferredSearch || daysFilter !== "all";

	if (isLoading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-10 w-full" />
				<div className="flex gap-2">
					<Skeleton className="h-10 w-[140px]" />
					<Skeleton className="h-10 flex-1" />
				</div>
				<div className="space-y-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-12" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{/* Search */}
			<div className="relative">
				<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder={t("searchPlaceholder")}
					value={localSearch}
					onChange={(e) => {
						setLocalSearch(e.target.value);
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
					fromDate={fromDate}
				/>
			</div>

			{/* Orders Table */}
			{isEmpty ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<p className="font-medium text-lg">
						{isFiltered ? t("emptyFiltered.title") : t("empty.title")}
					</p>
					<p className="text-muted-foreground text-sm">
						{isFiltered
							? t("emptyFiltered.description")
							: t("empty.description")}
					</p>
				</div>
			) : (
				<>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[80px]">
									{t("table.orderNumber")}
								</TableHead>
								<TableHead className="w-[200px]">
									{t("table.customer")}
								</TableHead>
								<TableHead className="w-[120px]">{t("table.type")}</TableHead>
								<TableHead className="w-[120px]">{t("table.status")}</TableHead>
								<TableHead className="w-[100px] text-right">
									{t("table.total")}
								</TableHead>
								<TableHead className="w-[150px]">{t("table.date")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{orders.map((order) => {
								const timeAgo = formatDistanceToNow(new Date(order.createdAt), {
									addSuffix: true,
									locale,
								});

								return (
									<TableRow
										key={order.id}
										className="cursor-pointer"
										onClick={() => handleRowClick(order.id)}
									>
										<TableCell>
											<Link
												to="/orders/$orderId"
												params={{ orderId: order.id }}
												search={{ storeId }}
												className="font-medium text-primary hover:underline"
												onClick={(e) => e.stopPropagation()}
											>
												#{String(order.pickupNumber).padStart(3, "0")}
											</Link>
										</TableCell>
										<TableCell>
											<span className="truncate">
												{order.customerName || "Guest"}
											</span>
										</TableCell>
										<TableCell>
											<Badge
												variant={orderTypeVariants[order.orderType]}
												className="text-xs"
											>
												{t(`orderType.${order.orderType}`)}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant={statusVariants[order.status] ?? "default"}
												className="text-xs"
											>
												{t(`status.${order.status}`)}
											</Badge>
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatPrice(order.totalAmount)}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{timeAgo}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>

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
