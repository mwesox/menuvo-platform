import { Link, useNavigate } from "@tanstack/react-router";
import { EyeOff, ImageOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatPrice } from "@/components/ui/price-input";
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

type Item = {
	id: string;
	translations: EntityTranslations | null;
	price: number;
	imageUrl: string | null;
	isAvailable: boolean;
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
	const navigate = useNavigate();

	const handleRowClick = (itemId: string) => {
		navigate({
			to: "/console/menu/categories/$categoryId/items/$itemId",
			params: { categoryId, itemId },
			search: { storeId },
		});
	};

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-[50%]">{t("table.name")}</TableHead>
					<TableHead className="text-center">{t("table.image")}</TableHead>
					<TableHead className="text-right">{t("table.price")}</TableHead>
					<TableHead className="text-center">{t("table.status")}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{items.length === 0 ? (
					<TableRow>
						<TableCell colSpan={4} className="h-24 text-center">
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
										to="/console/menu/categories/$categoryId/items/$itemId"
										params={{ categoryId, itemId: item.id }}
										search={{ storeId }}
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
									{!item.isAvailable && (
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
