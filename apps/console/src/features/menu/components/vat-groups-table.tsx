import type { AppRouter } from "@menuvo/api/trpc";
import {
	Badge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@menuvo/ui";
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
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-[35%]">{t("table.name")}</TableHead>
					<TableHead className="w-[20%]">{t("vat.table.code")}</TableHead>
					<TableHead className="w-[15%] text-center">
						{t("vat.table.rate")}
					</TableHead>
					<TableHead className="w-[30%]">{t("table.description")}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{vatGroups.length === 0 ? (
					<TableRow>
						<TableCell colSpan={4} className="h-24 text-center">
							{t("vat.emptyStates.noVatGroups")}
						</TableCell>
					</TableRow>
				) : (
					vatGroups.map((group) => (
						<TableRow
							key={group.id}
							className="cursor-pointer"
							onClick={() => handleRowClick(group.id)}
						>
							<TableCell>
								<Link
									to="/stores/$storeId/menu/vat/$vatGroupId"
									params={{ storeId, vatGroupId: group.id }}
									className="font-medium text-primary hover:underline"
									onClick={(e) => e.stopPropagation()}
								>
									{group.name}
								</Link>
							</TableCell>
							<TableCell>
								<Badge variant="outline">{group.code}</Badge>
							</TableCell>
							<TableCell className="text-center font-medium">
								{formatVatRate(group.rate)}
							</TableCell>
							<TableCell className="text-muted-foreground">
								{group.description || (
									<span className="text-muted-foreground">—</span>
								)}
							</TableCell>
						</TableRow>
					))
				)}
			</TableBody>
		</Table>
	);
}
