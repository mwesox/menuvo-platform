import {
	Badge,
	Button,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@menuvo/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Clock, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
			to: "/menu/categories/$categoryId",
			params: { categoryId },
			search: { storeId },
		});
	};

	const handleToggleActive = (
		e: React.MouseEvent,
		categoryId: string,
		currentIsActive: boolean,
	) => {
		e.stopPropagation();
		toggleActiveMutation.mutate({
			id: categoryId,
			isActive: !currentIsActive,
		});
	};

	const handleEditClick = (e: React.MouseEvent, categoryId: string) => {
		e.stopPropagation();
		navigate({
			to: "/menu/categories/$categoryId/edit",
			params: { categoryId },
			search: { storeId },
		});
	};

	return (
		<TooltipProvider>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[35%]">{t("table.category")}</TableHead>
						<TableHead className="text-center">{t("table.vatGroup")}</TableHead>
						<TableHead className="text-center">{t("table.image")}</TableHead>
						<TableHead className="text-center">{t("table.items")}</TableHead>
						<TableHead className="text-center">{t("table.active")}</TableHead>
						<TableHead className="text-center">{t("table.action")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{categories.length === 0 ? (
						<TableRow>
							<TableCell colSpan={6} className="h-24 text-center">
								{t("emptyStates.noCategories")}
							</TableCell>
						</TableRow>
					) : (
						categories.map((category) => {
							const name = getDisplayName(category.translations, language);
							const hasImage = category.items.some((item) => item.imageUrl);
							const itemCount = category.items.length;
							const activeCount = category.items.filter(
								(item) => item.isActive,
							).length;

							return (
								<TableRow
									key={category.id}
									className="cursor-pointer"
									onClick={() => handleRowClick(category.id)}
								>
									<TableCell>
										<div className="flex items-center gap-2">
											<Link
												to="/menu/categories/$categoryId"
												params={{ categoryId: category.id }}
												search={{ storeId }}
												className="font-medium text-primary hover:underline"
												onClick={(e) => e.stopPropagation()}
											>
												{name || t("emptyStates.unnamed")}
											</Link>
											{category.availabilitySchedule?.enabled && (
												<Tooltip>
													<TooltipTrigger asChild>
														<Badge variant="outline" className="gap-1">
															<Clock className="size-3" />
															{t("availability.badge", "Scheduled")}
														</Badge>
													</TooltipTrigger>
													<TooltipContent>
														<div className="space-y-1 text-xs">
															{category.availabilitySchedule.timeRange && (
																<div>
																	{t("availability.timeRange")}:{" "}
																	{
																		category.availabilitySchedule.timeRange
																			.startTime
																	}{" "}
																	-{" "}
																	{
																		category.availabilitySchedule.timeRange
																			.endTime
																	}
																</div>
															)}
															{category.availabilitySchedule.daysOfWeek &&
																category.availabilitySchedule.daysOfWeek
																	.length > 0 && (
																	<div>
																		{t("availability.daysOfWeek")}:{" "}
																		{category.availabilitySchedule.daysOfWeek.join(
																			", ",
																		)}
																	</div>
																)}
															{category.availabilitySchedule.dateRange && (
																<div>
																	{t("availability.dateRange")}:{" "}
																	{
																		category.availabilitySchedule.dateRange
																			.startDate
																	}{" "}
																	-{" "}
																	{
																		category.availabilitySchedule.dateRange
																			.endDate
																	}
																</div>
															)}
														</div>
													</TooltipContent>
												</Tooltip>
											)}
										</div>
									</TableCell>
									<TableCell className="text-center">
										{category.defaultVatGroup ? (
											<span className="text-sm">
												{category.defaultVatGroup.name}
											</span>
										) : (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>
									<TableCell className="text-center">
										{hasImage ? (
											<Check className="mx-auto h-4 w-4 text-muted-foreground" />
										) : (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>
									<TableCell className="text-center">
										{itemCount > 0 ? (
											activeCount < itemCount ? (
												<span>
													{activeCount}{" "}
													<span className="text-muted-foreground">
														({itemCount})
													</span>
												</span>
											) : (
												itemCount
											)
										) : (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>
									<TableCell className="text-center">
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="inline-flex">
													<Switch
														checked={category.isActive}
														disabled={toggleActiveMutation.isPending}
														onClick={(e) =>
															handleToggleActive(
																e,
																category.id,
																category.isActive,
															)
														}
													/>
												</div>
											</TooltipTrigger>
											<TooltipContent>
												{category.isActive
													? t("tooltips.deactivateCategory")
													: t("tooltips.activateCategory")}
											</TooltipContent>
										</Tooltip>
									</TableCell>
									<TableCell className="text-center">
										<Button
											variant="ghost"
											size="icon"
											onClick={(e) => handleEditClick(e, category.id)}
										>
											<Pencil className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
		</TooltipProvider>
	);
}
