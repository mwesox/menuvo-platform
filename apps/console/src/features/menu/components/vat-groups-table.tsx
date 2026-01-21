import { Badge, Link as ChakraLink, Table, Text } from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { Link, useNavigate } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { useTranslation } from "react-i18next";
import { formatVatRate } from "../vat.schemas";

type RouterOutput = inferRouterOutputs<AppRouter>;
type VatGroup = RouterOutput["menu"]["vat"]["list"][number];

interface VatGroupsTableProps {
	vatGroups: VatGroup[];
	storeId: string;
}

export function VatGroupsTable({ vatGroups, storeId }: VatGroupsTableProps) {
	const { t } = useTranslation("menu");
	const navigate = useNavigate();

	const handleRowClick = (vatGroupId: string) => {
		navigate({
			to: "/stores/$storeId/menu/vat/$vatGroupId",
			params: { storeId, vatGroupId },
		});
	};

	return (
		<Table.Root size="sm">
			<Table.Header>
				<Table.Row>
					<Table.ColumnHeader w="35%">{t("table.name")}</Table.ColumnHeader>
					<Table.ColumnHeader w="20%">{t("vat.table.code")}</Table.ColumnHeader>
					<Table.ColumnHeader w="15%" textAlign="center">
						{t("vat.table.rate")}
					</Table.ColumnHeader>
					<Table.ColumnHeader w="30%">
						{t("table.description")}
					</Table.ColumnHeader>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{vatGroups.length === 0 ? (
					<Table.Row>
						<Table.Cell colSpan={4} h="24" textAlign="center">
							{t("vat.emptyStates.noVatGroups")}
						</Table.Cell>
					</Table.Row>
				) : (
					vatGroups.map((group) => (
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
										to="/stores/$storeId/menu/vat/$vatGroupId"
										params={{ storeId, vatGroupId: group.id }}
										onClick={(e) => e.stopPropagation()}
									>
										{group.name}
									</Link>
								</ChakraLink>
							</Table.Cell>
							<Table.Cell>
								<Badge variant="outline">{group.code}</Badge>
							</Table.Cell>
							<Table.Cell textAlign="center" fontWeight="medium">
								{formatVatRate(group.rate)}
							</Table.Cell>
							<Table.Cell color="fg.muted">
								{group.description || <Text color="fg.muted">—</Text>}
							</Table.Cell>
						</Table.Row>
					))
				)}
			</Table.Body>
		</Table.Root>
	);
}
