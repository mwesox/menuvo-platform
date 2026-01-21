import { Chart, useChart } from "@chakra-ui/charts";
import {
	Button,
	Card,
	Heading,
	HStack,
	Icon,
	SimpleGrid,
	Skeleton,
	Stat,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, Plus, RefreshCw, ShoppingCart, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useStoreSelection } from "@/contexts/store-selection-context";
import { trpcUtils, useTRPC } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/_app/")({
	loader: async () => {
		await trpcUtils.store.list.ensureData();
	},
	component: DashboardPage,
});

function DashboardPage() {
	const { t } = useTranslation("dashboard");
	const {
		stores,
		isLoading: storesLoading,
		selectedStoreId,
	} = useStoreSelection();
	const trpc = useTRPC();

	// Calculate start date (30 days ago) - use UTC to avoid timezone issues
	const startDate = useMemo(() => {
		const date = new Date();
		date.setUTCDate(date.getUTCDate() - 29); // 29 days ago = 30 days including today
		date.setUTCHours(0, 0, 0, 0);
		return date;
	}, []);

	// Summary stats query - storeId is guaranteed when enabled
	const statsQuery = useQuery({
		...trpc.order.getStats.queryOptions({
			storeId: selectedStoreId as string,
			startDate,
		}),
		enabled: !!selectedStoreId,
		staleTime: Number.POSITIVE_INFINITY,
		refetchOnWindowFocus: false,
	});

	// Daily stats for chart - storeId is guaranteed when enabled
	const dailyStatsQuery = useQuery({
		...trpc.order.getDailyStats.queryOptions({
			storeId: selectedStoreId as string,
			startDate,
		}),
		enabled: !!selectedStoreId,
		staleTime: Number.POSITIVE_INFINITY,
		refetchOnWindowFocus: false,
	});

	// Combined refresh
	const handleRefresh = () => {
		statsQuery.refetch();
		dailyStatsQuery.refetch();
	};

	const isLoading =
		storesLoading || statsQuery.isLoading || dailyStatsQuery.isLoading;
	const isFetching = statsQuery.isFetching || dailyStatsQuery.isFetching;

	// No stores state
	if (!storesLoading && stores.length === 0) {
		return (
			<VStack align="stretch" gap="6">
				<Heading
					as="h1"
					fontWeight="bold"
					textStyle="2xl"
					letterSpacing="tight"
				>
					{t("title")}
				</Heading>

				<Card.Root>
					<Card.Header>
						<Card.Title>{t("gettingStarted.title")}</Card.Title>
					</Card.Header>
					<Card.Body>
						<VStack align="stretch" gap="4">
							<Text color="fg.muted" textStyle="sm">
								{t("gettingStarted.description")}
							</Text>
							<Button
								asChild
								colorPalette="primary"
								size="md"
								w={{ base: "full", sm: "auto" }}
							>
								<Link to="/stores/new">
									<Plus
										style={{
											height: "1rem",
											width: "1rem",
											marginRight: "0.5rem",
										}}
									/>
									{t("gettingStarted.createStore")}
								</Link>
							</Button>
						</VStack>
					</Card.Body>
				</Card.Root>
			</VStack>
		);
	}

	// No store selected state
	if (!selectedStoreId && !storesLoading) {
		return (
			<VStack align="stretch" gap="6">
				<Heading
					as="h1"
					fontWeight="bold"
					textStyle="2xl"
					letterSpacing="tight"
				>
					{t("title")}
				</Heading>

				<Card.Root>
					<Card.Body>
						<Text color="fg.muted" textStyle="sm">
							{t("noStoreSelected")}
						</Text>
					</Card.Body>
				</Card.Root>
			</VStack>
		);
	}

	const stats = statsQuery.data;
	const dailyStats = dailyStatsQuery.data ?? [];

	return (
		<VStack align="stretch" gap="6">
			<HStack justify="space-between" align="center">
				<Heading
					as="h1"
					fontWeight="bold"
					textStyle="2xl"
					letterSpacing="tight"
				>
					{t("title")}
				</Heading>
				<Button
					variant="outline"
					size="sm"
					onClick={handleRefresh}
					loading={isFetching}
				>
					<RefreshCw style={{ height: "1rem", width: "1rem" }} />
					{t("refresh")}
				</Button>
			</HStack>

			{/* Stats Cards */}
			<SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
				<Card.Root>
					<Card.Body>
						<Stat.Root>
							<HStack justify="space-between" align="flex-start" mb="2">
								<Stat.Label>{t("stats.totalOrders")}</Stat.Label>
								<Icon color="fg.muted">
									<ShoppingCart
										style={{ height: "1.25rem", width: "1.25rem" }}
									/>
								</Icon>
							</HStack>
							{isLoading ? (
								<Skeleton height="36px" width="80px" />
							) : (
								<Stat.ValueText fontWeight="bold" textStyle="3xl">
									{stats?.totalOrders ?? 0}
								</Stat.ValueText>
							)}
							<Stat.HelpText color="fg.muted" mt="1">
								{t("stats.last30Days")}
							</Stat.HelpText>
						</Stat.Root>
					</Card.Body>
				</Card.Root>

				<Card.Root>
					<Card.Body>
						<Stat.Root>
							<HStack justify="space-between" align="flex-start" mb="2">
								<Stat.Label>{t("stats.totalRevenue")}</Stat.Label>
								<Icon color="fg.muted">
									<Coins style={{ height: "1.25rem", width: "1.25rem" }} />
								</Icon>
							</HStack>
							{isLoading ? (
								<Skeleton height="36px" width="100px" />
							) : (
								<Stat.ValueText fontWeight="bold" textStyle="3xl">
									{formatCurrency(stats?.totalRevenue ?? 0)}
								</Stat.ValueText>
							)}
							<Stat.HelpText color="fg.muted" mt="1">
								{t("stats.last30Days")}
							</Stat.HelpText>
						</Stat.Root>
					</Card.Body>
				</Card.Root>

				<Card.Root>
					<Card.Body>
						<Stat.Root>
							<HStack justify="space-between" align="flex-start" mb="2">
								<Stat.Label>{t("stats.avgOrderValue")}</Stat.Label>
								<Icon color="fg.muted">
									<TrendingUp style={{ height: "1.25rem", width: "1.25rem" }} />
								</Icon>
							</HStack>
							{isLoading ? (
								<Skeleton height="36px" width="80px" />
							) : (
								<Stat.ValueText fontWeight="bold" textStyle="3xl">
									{formatCurrency(stats?.averageOrderValue ?? 0)}
								</Stat.ValueText>
							)}
							<Stat.HelpText color="fg.muted" mt="1">
								{t("stats.last30Days")}
							</Stat.HelpText>
						</Stat.Root>
					</Card.Body>
				</Card.Root>
			</SimpleGrid>

			{/* Line Chart */}
			<Card.Root>
				<Card.Header>
					<Card.Title>{t("chart.title")}</Card.Title>
				</Card.Header>
				<Card.Body>
					{isLoading ? (
						<Skeleton height="300px" />
					) : (
						<OrdersRevenueChart data={dailyStats} />
					)}
				</Card.Body>
			</Card.Root>
		</VStack>
	);
}

interface ChartData {
	date: string;
	orders: number;
	revenue: number;
}

function OrdersRevenueChart({ data }: { data: ChartData[] }) {
	const { t } = useTranslation("dashboard");
	const chart = useChart({
		data,
		series: [
			{ name: "orders", color: "teal.solid", label: t("chart.orders") },
			{ name: "revenue", color: "purple.solid", label: t("chart.revenue") },
		],
	});

	// Format date for display
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
	};

	// Format currency for Y-axis
	const formatRevenueAxis = (value: number) => {
		if (value === 0) return "0 €";
		return formatCurrency(value);
	};

	if (data.length === 0) {
		return (
			<VStack py="12" gap="2">
				<Text color="fg.muted" textStyle="sm">
					{t("chart.noData")}
				</Text>
			</VStack>
		);
	}

	return (
		<Chart.Root maxH="sm" chart={chart}>
			<LineChart
				data={chart.data}
				margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
			>
				<CartesianGrid stroke={chart.color("border")} vertical={false} />
				<XAxis
					axisLine={false}
					dataKey={chart.key("date")}
					tickFormatter={formatDate}
					stroke={chart.color("border")}
					tick={{ fontSize: 12 }}
					interval="preserveStartEnd"
				/>
				<YAxis
					yAxisId="left"
					axisLine={false}
					tickLine={false}
					tickMargin={10}
					stroke={chart.color("border")}
					tick={{ fontSize: 12 }}
					allowDecimals={false}
				/>
				<YAxis
					yAxisId="right"
					orientation="right"
					axisLine={false}
					tickLine={false}
					tickMargin={10}
					tickFormatter={formatRevenueAxis}
					stroke={chart.color("border")}
					tick={{ fontSize: 12 }}
				/>
				<Tooltip
					animationDuration={100}
					cursor={{ stroke: chart.color("border") }}
					content={<Chart.Tooltip />}
				/>
				<Legend verticalAlign="top" align="right" content={<Chart.Legend />} />
				<Line
					yAxisId="left"
					isAnimationActive={false}
					dataKey={chart.key("orders")}
					stroke={chart.color("teal.solid")}
					strokeWidth={2}
					dot={false}
				/>
				<Line
					yAxisId="right"
					isAnimationActive={false}
					dataKey={chart.key("revenue")}
					stroke={chart.color("purple.solid")}
					strokeWidth={2}
					dot={false}
				/>
			</LineChart>
		</Chart.Root>
	);
}
