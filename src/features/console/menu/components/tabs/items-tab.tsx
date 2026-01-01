import { Link } from "@tanstack/react-router";
import { Plus, UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import type { Item } from "@/db/schema";
import { ItemCard } from "@/features/console/menu/components/item-card";
import { useToggleItemAvailableByStore } from "@/features/console/menu/queries";

interface ItemsTabProps {
	storeId: number;
	items: Item[];
	onDelete: (itemId: number) => void;
}

export function ItemsTab({ storeId, items, onDelete }: ItemsTabProps) {
	const { t } = useTranslation("menu");
	const toggleAvailableMutation = useToggleItemAvailableByStore(storeId);

	if (items.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<UtensilsCrossed />
					</EmptyMedia>
					<EmptyTitle>{t("emptyStates.noItems")}</EmptyTitle>
					<EmptyDescription>
						{t("emptyStates.noItemsDescription")}
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button variant="outline" asChild>
						<Link to="/console/menu/items/new" search={{ storeId }}>
							<Plus className="mr-2 h-4 w-4" />
							{t("titles.addItem")}
						</Link>
					</Button>
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{items.map((item) => (
				<ItemCard
					key={item.id}
					item={item}
					onToggleAvailable={(itemId, isAvailable) =>
						toggleAvailableMutation.mutate({ itemId, isAvailable })
					}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}
