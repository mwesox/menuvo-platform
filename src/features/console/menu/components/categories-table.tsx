import { Link, useNavigate } from "@tanstack/react-router";
import { Check, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { EntityTranslations } from "@/db/schema";
import { getDisplayName } from "../logic/display";

type CategoryWithItems = {
	id: string;
	translations: EntityTranslations | null;
	isActive: boolean;
	items: Array<{
		id: string;
		isAvailable: boolean;
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
	const navigate = useNavigate();

	const handleRowClick = (categoryId: string) => {
		navigate({
			to: "/console/menu/categories/$categoryId",
			params: { categoryId },
			search: { storeId },
		});
	};

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-[50%]">{t("table.category")}</TableHead>
					<TableHead className="text-center">{t("table.image")}</TableHead>
					<TableHead className="text-center">{t("table.items")}</TableHead>
					<TableHead className="text-center">{t("table.status")}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{categories.length === 0 ? (
					<TableRow>
						<TableCell colSpan={4} className="h-24 text-center">
							{t("emptyStates.noCategories")}
						</TableCell>
					</TableRow>
				) : (
					categories.map((category) => {
						const name = getDisplayName(category.translations, language);
						const hasImage = category.items.some((item) => item.imageUrl);
						const itemCount = category.items.length;
						const availableCount = category.items.filter(
							(item) => item.isAvailable,
						).length;

						return (
							<TableRow
								key={category.id}
								className="cursor-pointer"
								onClick={() => handleRowClick(category.id)}
							>
								<TableCell>
									<Link
										to="/console/menu/categories/$categoryId"
										params={{ categoryId: category.id }}
										search={{ storeId }}
										className="font-medium text-primary hover:underline"
										onClick={(e) => e.stopPropagation()}
									>
										{name || t("emptyStates.unnamed")}
									</Link>
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
										availableCount < itemCount ? (
											<span>
												{availableCount}{" "}
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
									{!category.isActive && (
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
