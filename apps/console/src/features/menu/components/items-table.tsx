import {
	formatPrice,
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
import { ImageOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { getDisplayName } from "../logic/display";
import type { EntityTranslations } from "../options.schemas";
import type { ItemValidationResult } from "../validation.types";
import { ItemValidationBadge } from "./item-validation-badge";

type Item = {
	id: string;
	translations: EntityTranslations | null;
	price: number;
	imageUrl: string | null;
	isActive: boolean;
	validation?: ItemValidationResult;
};

interface ItemsTableProps {
	items: Item[];
	categoryId: string;
	storeId: string;
	language: string;
}

export function ItemsTable({
	items,
	categoryId,
	storeId,
	language,
}: ItemsTableProps) {
	const { t } = useTranslation("menu");
	const { t: tToasts } = useTranslation("toasts");
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();

	const toggleActiveMutation = useMutation({
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
			trpcClient.menu.items.toggleActive.mutate({ id, isActive }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.menu.queries.getCategory.queryKey({ categoryId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.menu.items.listByStore.queryKey({ storeId }),
			});
		},
		onError: (error) => {
			if (error.message.includes("validation")) {
				toast.error(tToasts("error.cannotActivateWithIssues"));
			} else {
				toast.error(tToasts("error.updateItem"));
			}
		},
	});

	const handleRowClick = (itemId: string) => {
		navigate({
			to: "/stores/$storeId/menu/categories/$categoryId/items/$itemId",
			params: { storeId, categoryId, itemId },
		});
	};

	const handleToggleActive = (
		e: React.MouseEvent,
		itemId: string,
		currentIsActive: boolean,
		isPublishable: boolean,
	) => {
		e.stopPropagation();
		// If trying to activate but not publishable, show error
		if (!currentIsActive && !isPublishable) {
			toast.error(tToasts("error.cannotActivateWithIssues"));
			return;
		}
		toggleActiveMutation.mutate({ id: itemId, isActive: !currentIsActive });
	};

	return (
		<TooltipProvider>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[45%]">{t("table.name")}</TableHead>
						<TableHead className="text-center">{t("table.image")}</TableHead>
						<TableHead className="text-right">{t("table.price")}</TableHead>
						<TableHead className="w-[60px] text-center">
							{t("table.validation")}
						</TableHead>
						<TableHead className="text-center">{t("table.status")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.length === 0 ? (
						<TableRow>
							<TableCell colSpan={5} className="h-24 text-center">
								{t("emptyStates.noItemsInCategory")}
							</TableCell>
						</TableRow>
					) : (
						items.map((item) => {
							const name = getDisplayName(item.translations, language);

							return (
								<TableRow
									key={item.id}
									className="cursor-pointer"
									onClick={() => handleRowClick(item.id)}
								>
									<TableCell>
										<Link
											to="/stores/$storeId/menu/categories/$categoryId/items/$itemId"
											params={{ storeId, categoryId, itemId: item.id }}
											className="font-medium text-primary hover:underline"
											onClick={(e) => e.stopPropagation()}
										>
											{name || t("emptyStates.unnamed")}
										</Link>
									</TableCell>
									<TableCell className="text-center">
										{item.imageUrl ? (
											<img
												src={item.imageUrl}
												alt=""
												className="mx-auto h-8 w-8 rounded object-cover"
											/>
										) : (
											<div className="mx-auto flex h-8 w-8 items-center justify-center rounded bg-muted">
												<ImageOff className="h-4 w-4 text-muted-foreground" />
											</div>
										)}
									</TableCell>
									<TableCell className="text-right">
										{formatPrice(item.price)}
									</TableCell>
									<TableCell className="text-center">
										{item.validation && (
											<ItemValidationBadge
												validation={item.validation}
												compact
											/>
										)}
									</TableCell>
									<TableCell className="text-center">
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="inline-flex">
													<Switch
														checked={item.isActive}
														disabled={
															toggleActiveMutation.isPending ||
															(!item.isActive &&
																item.validation &&
																!item.validation.isPublishable)
														}
														onClick={(e) =>
															handleToggleActive(
																e,
																item.id,
																item.isActive,
																item.validation?.isPublishable ?? true,
															)
														}
													/>
												</div>
											</TooltipTrigger>
											<TooltipContent>
												{item.isActive
													? t("tooltips.deactivateItem")
													: item.validation && !item.validation.isPublishable
														? t("tooltips.cannotActivateWithIssues")
														: t("tooltips.activateItem")}
											</TooltipContent>
										</Tooltip>
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
