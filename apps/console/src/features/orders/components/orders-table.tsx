import {
	Badge,
	Button,
	createListCollection,
	EmptyState,
	HStack,
	Icon,
	Input,
	InputGroup,
	Portal,
	Select,
	Skeleton,
	Table,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Calendar, Filter, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Caption } from "@/components/ui/typography";
import {
	type OrderStatus,
	type OrderType,
	orderStatuses,
} from "@/features/orders";
import { formatPrice } from "@/features/orders/logic/order-pricing";
import type { OrderListItem } from "@/features/orders/types";
import {
	type DateRangePreset,
	dateRangePresets,
} from "@/features/orders/types";
import { useTRPC } from "@/lib/trpc";
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

const statusVariants: Record<OrderStatus, "outline" | "solid" | "subtle"> = {
	awaiting_payment: "outline",
	confirmed: "solid",
	preparing: "subtle",
	ready: "solid",
	completed: "subtle",
	cancelled: "solid",
};

const statusColorPalettes: Record<OrderStatus, string> = {
	awaiting_payment: "gray",
	confirmed: "blue",
	preparing: "blue",
	ready: "green",
	completed: "gray",
	cancelled: "red",
};

const orderTypeVariants: Record<OrderType, "outline" | "solid" | "subtle"> = {
	dine_in: "outline",
	takeaway: "subtle",
	delivery: "solid",
};

const orderTypeColorPalettes: Record<OrderType, string> = {
	dine_in: "gray",
	takeaway: "blue",
	delivery: "green",
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
			to: "/stores/$storeId/orders/$orderId",
			params: { storeId, orderId },
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
			<VStack gap="3" align="stretch">
				<Skeleton h="10" w="full" />
				<HStack gap="2">
					<Skeleton h="10" w="140px" />
					<Skeleton h="10" flex="1" />
				</HStack>
				<VStack gap="2" align="stretch">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} h="12" />
					))}
				</VStack>
			</VStack>
		);
	}

	const daysCollection = createListCollection({
		items: dateRangePresets.map((preset) => ({
			value: preset,
			label: t(`dateRange.${preset}`),
		})),
	});

	const statusCollection = createListCollection({
		items: [
			{ value: "all", label: t("allStatuses") },
			...orderStatuses.map((status) => ({
				value: status,
				label: t(`status.${status}`),
			})),
		],
	});

	return (
		<VStack gap="3" align="stretch">
			{/* Search */}
			<InputGroup
				startElement={<Search style={{ height: "1rem", width: "1rem" }} />}
			>
				<Input
					type="search"
					placeholder={t("searchPlaceholder")}
					value={localSearch}
					onChange={(e) => {
						setLocalSearch(e.target.value);
					}}
				/>
			</InputGroup>

			{/* Filters row */}
			<HStack gap="2" justify="space-between">
				<Select.Root
					collection={daysCollection}
					value={[daysFilter]}
					onValueChange={(e) =>
						handleDaysFilterChange(e.value[0] ?? daysFilter)
					}
					variant="outline"
					size="sm"
				>
					<Select.HiddenSelect />
					<Select.Control>
						<Select.Trigger minW="40" maxW="48" gap="2">
							<HStack gap="2" flex="1" overflow="hidden" minW="0">
								<Icon w="4" h="4" color="fg.muted" flexShrink={0}>
									<Calendar />
								</Icon>
								<Select.ValueText />
							</HStack>
						</Select.Trigger>
						<Select.IndicatorGroup>
							<Select.Indicator />
						</Select.IndicatorGroup>
					</Select.Control>
					<Portal>
						<Select.Positioner>
							<Select.Content>
								{daysCollection.items.map((item) => (
									<Select.Item key={item.value} item={item}>
										{item.label}
										<Select.ItemIndicator />
									</Select.Item>
								))}
							</Select.Content>
						</Select.Positioner>
					</Portal>
				</Select.Root>
				<HStack gap="2">
					<Select.Root
						collection={statusCollection}
						value={statusFilter ? [statusFilter] : ["all"]}
						onValueChange={(e) => handleStatusFilterChange(e.value[0] ?? "all")}
						variant="outline"
						size="sm"
					>
						<Select.HiddenSelect />
						<Select.Control>
							<Select.Trigger minW="40" maxW="48" gap="2">
								<HStack gap="2" flex="1" minW="0">
									<Icon w="4" h="4" color="fg.muted" flexShrink={0}>
										<Filter />
									</Icon>
									<Select.ValueText placeholder={t("filterByStatus")} />
								</HStack>
							</Select.Trigger>
							<Select.IndicatorGroup>
								<Select.Indicator />
							</Select.IndicatorGroup>
						</Select.Control>
						<Portal>
							<Select.Positioner>
								<Select.Content>
									{statusCollection.items.map((item) => (
										<Select.Item key={item.value} item={item}>
											{item.label}
											<Select.ItemIndicator />
										</Select.Item>
									))}
								</Select.Content>
							</Select.Positioner>
						</Portal>
					</Select.Root>
					<ExportOrdersButton
						storeId={storeId}
						statusFilter={statusFilter}
						fromDate={fromDate}
					/>
				</HStack>
			</HStack>

			{/* Orders Table */}
			{isEmpty ? (
				<EmptyState.Root>
					<EmptyState.Content>
						<VStack textAlign="center">
							<EmptyState.Title>
								{isFiltered ? t("emptyFiltered.title") : t("empty.title")}
							</EmptyState.Title>
							<EmptyState.Description>
								{isFiltered
									? t("emptyFiltered.description")
									: t("empty.description")}
							</EmptyState.Description>
						</VStack>
					</EmptyState.Content>
				</EmptyState.Root>
			) : (
				<VStack gap="3" align="stretch">
					<Table.Root size="sm">
						<Table.Header>
							<Table.Row>
								<Table.ColumnHeader w="80px">
									{t("table.orderNumber")}
								</Table.ColumnHeader>
								<Table.ColumnHeader w="200px">
									{t("table.customer")}
								</Table.ColumnHeader>
								<Table.ColumnHeader w="120px">
									{t("table.type")}
								</Table.ColumnHeader>
								<Table.ColumnHeader w="120px">
									{t("table.status")}
								</Table.ColumnHeader>
								<Table.ColumnHeader w="100px" textAlign="end">
									{t("table.total")}
								</Table.ColumnHeader>
								<Table.ColumnHeader w="150px">
									{t("table.date")}
								</Table.ColumnHeader>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{orders.map((order) => {
								const timeAgo = formatDistanceToNow(new Date(order.createdAt), {
									addSuffix: true,
									locale,
								});

								return (
									<Table.Row
										key={order.id}
										cursor="pointer"
										onClick={() => handleRowClick(order.id)}
									>
										<Table.Cell>
											<Link
												to="/stores/$storeId/orders/$orderId"
												params={{ storeId, orderId: order.id }}
												onClick={(e) => e.stopPropagation()}
											>
												<Text
													fontWeight="medium"
													color="primary"
													_hover={{ textDecoration: "underline" }}
												>
													#{String(order.pickupNumber).padStart(3, "0")}
												</Text>
											</Link>
										</Table.Cell>
										<Table.Cell>
											<Text truncate>{order.customerName || "Guest"}</Text>
										</Table.Cell>
										<Table.Cell>
											<Badge
												variant={orderTypeVariants[order.orderType]}
												colorPalette={orderTypeColorPalettes[order.orderType]}
												size="xs"
											>
												{t(`orderType.${order.orderType}`)}
											</Badge>
										</Table.Cell>
										<Table.Cell>
											<Badge
												variant={statusVariants[order.status] ?? "solid"}
												colorPalette={
													statusColorPalettes[order.status] ?? "gray"
												}
												size="xs"
											>
												{t(`status.${order.status}`)}
											</Badge>
										</Table.Cell>
										<Table.Cell textAlign="end">
											<Text fontWeight="medium">
												{formatPrice(order.totalAmount)}
											</Text>
										</Table.Cell>
										<Table.Cell>
											<Caption>{timeAgo}</Caption>
										</Table.Cell>
									</Table.Row>
								);
							})}
						</Table.Body>
					</Table.Root>

					{hasMore && (
						<Button variant="outline" onClick={handleLoadMore} w="full">
							{t("loadMore")}
						</Button>
					)}
				</VStack>
			)}
		</VStack>
	);
}
