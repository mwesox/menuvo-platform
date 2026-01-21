import {
	Badge,
	Box,
	Button,
	Link as ChakraLink,
	HStack,
	Switch,
	Table,
	Text,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Clock, Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Tooltip } from "@/components/ui/tooltip";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { getDisplayName } from "../logic/display";
import type { EntityTranslations } from "../options.schemas";

type CategoryWithItems = {
	id: string;
	translations: EntityTranslations | null;
	isActive: boolean;
	defaultVatGroup: {
		id: string;
		name: string;
		code: string;
		rate: number;
	} | null;
	availabilitySchedule?: {
		enabled: boolean;
		timeRange?: { startTime: string; endTime: string };
		daysOfWeek?: string[];
		dateRange?: { startDate: string; endDate: string };
	} | null;
	items: Array<{
		id: string;
		isActive: boolean;
		imageUrl: string | null;
	}>;
};

interface CategoriesTableProps {
	categories: CategoryWithItems[];
	storeId: string;
	language: string;
}

export function CategoriesTable({
	categories,
	storeId,
	language,
}: CategoriesTableProps) {
	const { t } = useTranslation("menu");
	const { t: tToasts } = useTranslation("toasts");
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();

	const toggleActiveMutation = useMutation({
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
			trpcClient.menu.categories.toggleActive.mutate({ id, isActive }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.menu.queries.getCategories.queryKey({ storeId }),
			});
		},
		onError: (error) => {
			toast.error(tToasts("error.updateCategory") || error.message);
		},
	});

	const handleRowClick = (categoryId: string) => {
		navigate({
			to: "/stores/$storeId/menu/categories/$categoryId",
			params: { storeId, categoryId },
		});
	};

	const handleToggleActive = (categoryId: string, currentIsActive: boolean) => {
		toggleActiveMutation.mutate({
			id: categoryId,
			isActive: !currentIsActive,
		});
	};

	const getAvailabilityTooltipContent = (
		schedule: NonNullable<CategoryWithItems["availabilitySchedule"]>,
	): ReactNode => {
		const parts: ReactNode[] = [];
		if (schedule.timeRange) {
			parts.push(
				<Text key="time" textStyle="xs">
					{t("availability.timeRange")}: {schedule.timeRange.startTime} -{" "}
					{schedule.timeRange.endTime}
				</Text>,
			);
		}
		if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
			parts.push(
				<Text key="days" textStyle="xs">
					{t("availability.daysOfWeek")}: {schedule.daysOfWeek.join(", ")}
				</Text>,
			);
		}
		if (schedule.dateRange) {
			parts.push(
				<Text key="date" textStyle="xs">
					{t("availability.dateRange")}: {schedule.dateRange.startDate} -{" "}
					{schedule.dateRange.endDate}
				</Text>,
			);
		}
		return <Box>{parts}</Box>;
	};

	return (
		<Table.ScrollArea borderWidth="1px" rounded="md">
			<Table.Root
				size="sm"
				css={{
					"& [data-sticky]": {
						position: "sticky",
						left: 0,
						zIndex: 1,
						bg: "bg",
					},
				}}
			>
				<Table.Header>
					<Table.Row>
						<Table.ColumnHeader data-sticky minW="150px">
							{t("table.category")}
						</Table.ColumnHeader>
						<Table.ColumnHeader textAlign="center" minW="100px">
							{t("table.vatGroup")}
						</Table.ColumnHeader>
						<Table.ColumnHeader textAlign="center" minW="60px">
							{t("table.image")}
						</Table.ColumnHeader>
						<Table.ColumnHeader textAlign="center" minW="80px">
							{t("table.items")}
						</Table.ColumnHeader>
						<Table.ColumnHeader textAlign="center" minW="70px">
							{t("table.active")}
						</Table.ColumnHeader>
						<Table.ColumnHeader textAlign="center" minW="70px">
							{t("table.action")}
						</Table.ColumnHeader>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{categories.length === 0 ? (
						<Table.Row>
							<Table.Cell colSpan={6} h="24" textAlign="center">
								{t("emptyStates.noCategories")}
							</Table.Cell>
						</Table.Row>
					) : (
						categories.map((category) => {
							const name = getDisplayName(category.translations, language);
							const hasImage = category.items.some((item) => item.imageUrl);
							const itemCount = category.items.length;
							const activeCount = category.items.filter(
								(item) => item.isActive,
							).length;

							return (
								<Table.Row
									key={category.id}
									cursor="pointer"
									onClick={() => handleRowClick(category.id)}
								>
									<Table.Cell data-sticky>
										<HStack gap="2" align="center">
											<ChakraLink
												variant="underline"
												colorPalette="primary"
												fontWeight="medium"
												asChild
											>
												<Link
													to="/stores/$storeId/menu/categories/$categoryId"
													params={{ storeId, categoryId: category.id }}
													onClick={(e) => e.stopPropagation()}
												>
													{name || t("emptyStates.unnamed")}
												</Link>
											</ChakraLink>
											{category.availabilitySchedule?.enabled && (
												<Tooltip
													content={getAvailabilityTooltipContent(
														category.availabilitySchedule,
													)}
												>
													<Badge variant="outline" gap="1">
														<Clock
															style={{ height: "0.75rem", width: "0.75rem" }}
														/>
														{t("availability.badge", "Scheduled")}
													</Badge>
												</Tooltip>
											)}
										</HStack>
									</Table.Cell>
									<Table.Cell textAlign="center">
										{category.defaultVatGroup ? (
											<Text textStyle="sm">
												{category.defaultVatGroup.name}
											</Text>
										) : (
											<Text color="fg.muted">—</Text>
										)}
									</Table.Cell>
									<Table.Cell textAlign="center">
										{hasImage ? (
											<Check
												style={{
													margin: "0 auto",
													height: "1rem",
													width: "1rem",
												}}
												color="fg.muted"
											/>
										) : (
											<Text color="fg.muted">—</Text>
										)}
									</Table.Cell>
									<Table.Cell textAlign="center">
										{itemCount > 0 ? (
											activeCount < itemCount ? (
												<Text>
													{activeCount}{" "}
													<Text as="span" color="fg.muted">
														({itemCount})
													</Text>
												</Text>
											) : (
												itemCount
											)
										) : (
											<Text color="fg.muted">—</Text>
										)}
									</Table.Cell>
									<Table.Cell textAlign="center">
										<Tooltip
											content={
												category.isActive
													? t("tooltips.deactivateCategory")
													: t("tooltips.activateCategory")
											}
										>
											<Box
												display="inline-flex"
												onClick={(e) => e.stopPropagation()}
											>
												<Switch.Root
													checked={category.isActive}
													disabled={toggleActiveMutation.isPending}
													onCheckedChange={() =>
														handleToggleActive(category.id, category.isActive)
													}
													colorPalette="red"
												>
													<Switch.HiddenInput />
													<Switch.Control />
												</Switch.Root>
											</Box>
										</Tooltip>
									</Table.Cell>
									<Table.Cell textAlign="center">
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												navigate({
													to: "/stores/$storeId/menu/categories/$categoryId/edit",
													params: { storeId, categoryId: category.id },
												});
											}}
										>
											<Pencil style={{ height: "1rem", width: "1rem" }} />
										</Button>
									</Table.Cell>
								</Table.Row>
							);
						})
					)}
				</Table.Body>
			</Table.Root>
		</Table.ScrollArea>
	);
}
