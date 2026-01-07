import { Link, useNavigate } from "@tanstack/react-router";
import { EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { EntityTranslations, OptionGroupType } from "@/db/schema";
import { getDisplayName } from "../logic/display";

type OptionChoice = {
	id: string;
	translations: EntityTranslations | null;
	priceModifier: number;
	isAvailable: boolean;
	isDefault: boolean;
};

type OptionGroupWithChoices = {
	id: string;
	translations: EntityTranslations | null;
	type: OptionGroupType;
	isActive: boolean;
	isRequired: boolean;
	minSelections: number;
	maxSelections: number | null;
	numFreeOptions: number;
	choices: OptionChoice[];
};

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
			to: "/console/menu/options/$optionGroupId",
			params: { optionGroupId },
			search: { storeId },
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
	): "default" | "secondary" | "outline" => {
		switch (type) {
			case "single_select":
				return "default";
			case "multi_select":
				return "secondary";
			case "quantity_select":
				return "outline";
			default:
				return "default";
		}
	};

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-[50%]">{t("table.name")}</TableHead>
					<TableHead className="text-center">{t("table.type")}</TableHead>
					<TableHead className="text-center">{t("table.choices")}</TableHead>
					<TableHead className="text-center">{t("table.status")}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{optionGroups.length === 0 ? (
					<TableRow>
						<TableCell colSpan={4} className="h-24 text-center">
							{t("emptyStates.noOptionGroups")}
						</TableCell>
					</TableRow>
				) : (
					optionGroups.map((group) => {
						const name = getDisplayName(group.translations, language);
						const choiceCount = group.choices.length;

						return (
							<TableRow
								key={group.id}
								className="cursor-pointer"
								onClick={() => handleRowClick(group.id)}
							>
								<TableCell>
									<Link
										to="/console/menu/options/$optionGroupId"
										params={{ optionGroupId: group.id }}
										search={{ storeId }}
										className="font-medium text-primary hover:underline"
										onClick={(e) => e.stopPropagation()}
									>
										{name || t("emptyStates.unnamed")}
									</Link>
								</TableCell>
								<TableCell className="text-center">
									<Badge variant={getTypeBadgeVariant(group.type)}>
										{getTypeLabel(group.type)}
									</Badge>
								</TableCell>
								<TableCell className="text-center">
									{choiceCount > 0 ? (
										choiceCount
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</TableCell>
								<TableCell className="text-center">
									{!group.isActive && (
										<EyeOff className="mx-auto h-4 w-4 text-muted-foreground" />
									)}
								</TableCell>
							</TableRow>
						);
					})
				)}
			</TableBody>
		</Table>
	);
}
