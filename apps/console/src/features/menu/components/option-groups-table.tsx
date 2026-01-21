import { Badge, Box, Link as ChakraLink, Table, Text } from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { Link, useNavigate } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getDisplayName } from "../logic/display";
import type { OptionGroupType } from "../options.schemas";

type RouterOutput = inferRouterOutputs<AppRouter>;
type OptionGroupWithChoices =
	RouterOutput["menu"]["options"]["listGroups"][number];

interface OptionGroupsTableProps {
	optionGroups: OptionGroupWithChoices[];
	storeId: string;
	language: string;
}

export function OptionGroupsTable({
	optionGroups,
	storeId,
	language,
}: OptionGroupsTableProps) {
	const { t } = useTranslation("menu");
	const navigate = useNavigate();

	const handleRowClick = (optionGroupId: string) => {
		navigate({
			to: "/stores/$storeId/menu/options/$optionGroupId",
			params: { storeId, optionGroupId },
		});
	};

	const getTypeLabel = (type: OptionGroupType) => {
		switch (type) {
			case "single_select":
				return t("optionTypes.singleSelect");
			case "multi_select":
				return t("optionTypes.multiSelect");
			case "quantity_select":
				return t("optionTypes.quantitySelect");
			default:
				return type;
		}
	};

	const getTypeBadgeVariant = (
		type: OptionGroupType,
	): "solid" | "subtle" | "outline" => {
		switch (type) {
			case "single_select":
				return "solid";
			case "multi_select":
				return "subtle";
			case "quantity_select":
				return "outline";
			default:
				return "solid";
		}
	};

	return (
		<Table.Root size="sm">
			<Table.Header>
				<Table.Row>
					<Table.ColumnHeader w="50%">{t("table.name")}</Table.ColumnHeader>
					<Table.ColumnHeader textAlign="center">
						{t("table.type")}
					</Table.ColumnHeader>
					<Table.ColumnHeader textAlign="center">
						{t("table.choices")}
					</Table.ColumnHeader>
					<Table.ColumnHeader textAlign="center">
						{t("table.status")}
					</Table.ColumnHeader>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{optionGroups.length === 0 ? (
					<Table.Row>
						<Table.Cell colSpan={4} h="24" textAlign="center">
							{t("emptyStates.noOptionGroups")}
						</Table.Cell>
					</Table.Row>
				) : (
					optionGroups.map((group) => {
						const name = getDisplayName(group.translations, language);
						const choiceCount = group.choices.length;
						const groupType = group.type as OptionGroupType;

						return (
							<Table.Row
								key={group.id}
								cursor="pointer"
								onClick={() => handleRowClick(group.id)}
							>
								<Table.Cell>
									<ChakraLink
										variant="underline"
										colorPalette="primary"
										fontWeight="medium"
										asChild
									>
										<Link
											to="/stores/$storeId/menu/options/$optionGroupId"
											params={{ storeId, optionGroupId: group.id }}
											onClick={(e) => e.stopPropagation()}
										>
											{name || t("emptyStates.unnamed")}
										</Link>
									</ChakraLink>
								</Table.Cell>
								<Table.Cell textAlign="center">
									<Badge variant={getTypeBadgeVariant(groupType)}>
										{getTypeLabel(groupType)}
									</Badge>
								</Table.Cell>
								<Table.Cell textAlign="center">
									{choiceCount > 0 ? (
										choiceCount
									) : (
										<Text color="fg.muted">—</Text>
									)}
								</Table.Cell>
								<Table.Cell textAlign="center">
									{!group.isActive && (
										<Box display="flex" justifyContent="center">
											<EyeOff
												style={{ height: "1rem", width: "1rem" }}
												color="fg.muted"
											/>
										</Box>
									)}
								</Table.Cell>
							</Table.Row>
						);
					})
				)}
			</Table.Body>
		</Table.Root>
	);
}
