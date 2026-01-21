import {
	Box,
	Link as ChakraLink,
	Image,
	Switch,
	Table,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatPrice } from "@/components/ui/price-input";
import { Tooltip } from "@/components/ui/tooltip";
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
		<Table.Root size="sm">
			<Table.Header>
				<Table.Row>
					<Table.ColumnHeader w="45%">{t("table.name")}</Table.ColumnHeader>
					<Table.ColumnHeader textAlign="center">
						{t("table.image")}
					</Table.ColumnHeader>
					<Table.ColumnHeader textAlign="right">
						{t("table.price")}
					</Table.ColumnHeader>
					<Table.ColumnHeader w="60px" textAlign="center">
						{t("table.validation")}
					</Table.ColumnHeader>
					<Table.ColumnHeader textAlign="center">
						{t("table.status")}
					</Table.ColumnHeader>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{items.length === 0 ? (
					<Table.Row>
						<Table.Cell colSpan={5} h="24" textAlign="center">
							{t("emptyStates.noItemsInCategory")}
						</Table.Cell>
					</Table.Row>
				) : (
					items.map((item) => {
						const name = getDisplayName(item.translations, language);

						return (
							<Table.Row
								key={item.id}
								cursor="pointer"
								onClick={() => handleRowClick(item.id)}
							>
								<Table.Cell>
									<ChakraLink
										variant="underline"
										colorPalette="primary"
										fontWeight="medium"
										asChild
									>
										<Link
											to="/stores/$storeId/menu/categories/$categoryId/items/$itemId"
											params={{ storeId, categoryId, itemId: item.id }}
											onClick={(e) => e.stopPropagation()}
										>
											{name || t("emptyStates.unnamed")}
										</Link>
									</ChakraLink>
								</Table.Cell>
								<Table.Cell textAlign="center">
									{item.imageUrl ? (
										<Image
											src={item.imageUrl}
											alt=""
											mx="auto"
											h="8"
											w="8"
											rounded="md"
											objectFit="cover"
										/>
									) : (
										<Box
											mx="auto"
											display="flex"
											alignItems="center"
											justifyContent="center"
											h="8"
											w="8"
											rounded="md"
											bg="bg.muted"
										>
											<ImageOff
												style={{ height: "1rem", width: "1rem" }}
												color="var(--chakra-colors-fg-muted)"
											/>
										</Box>
									)}
								</Table.Cell>
								<Table.Cell textAlign="right">
									{formatPrice(item.price)}
								</Table.Cell>
								<Table.Cell textAlign="center">
									{item.validation && (
										<ItemValidationBadge validation={item.validation} compact />
									)}
								</Table.Cell>
								<Table.Cell textAlign="center">
									<Tooltip
										content={
											item.isActive
												? t("tooltips.deactivateItem")
												: item.validation && !item.validation.isPublishable
													? t("tooltips.cannotActivateWithIssues")
													: t("tooltips.activateItem")
										}
									>
										<Box display="inline-flex">
											<Switch.Root
												checked={item.isActive}
												disabled={
													toggleActiveMutation.isPending ||
													(!item.isActive &&
														item.validation &&
														!item.validation.isPublishable)
												}
												onCheckedChange={() =>
													handleToggleActive(
														{} as React.MouseEvent,
														item.id,
														item.isActive,
														item.validation?.isPublishable ?? true,
													)
												}
												colorPalette="red"
											>
												<Switch.HiddenInput />
												<Switch.Control />
											</Switch.Root>
										</Box>
									</Tooltip>
								</Table.Cell>
							</Table.Row>
						);
					})
				)}
			</Table.Body>
		</Table.Root>
	);
}
