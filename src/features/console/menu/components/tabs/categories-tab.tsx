import { Layers, Plus } from "lucide-react";
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
import type { Category, Item } from "@/db/schema";
import { CategoryCard } from "@/features/console/menu/components/category-card";
import { useToggleCategoryActive } from "@/features/console/menu/queries";

interface CategoriesTabProps {
	storeId: number;
	categories: Array<Category & { items: Item[] }>;
	onEdit: (category: Category) => void;
	onDelete: (categoryId: number) => void;
	onAdd: () => void;
}

export function CategoriesTab({
	storeId,
	categories,
	onEdit,
	onDelete,
	onAdd,
}: CategoriesTabProps) {
	const { t } = useTranslation("menu");
	const toggleActiveMutation = useToggleCategoryActive(storeId);

	if (categories.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Layers />
					</EmptyMedia>
					<EmptyTitle>{t("emptyStates.noCategories")}</EmptyTitle>
					<EmptyDescription>
						{t("emptyStates.noCategoriesDescription")}
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button variant="outline" onClick={onAdd}>
						<Plus className="mr-2 h-4 w-4" />
						{t("titles.addCategory")}
					</Button>
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{categories.map((category) => (
				<CategoryCard
					key={category.id}
					category={category}
					storeId={storeId}
					onToggleActive={(categoryId, isActive) =>
						toggleActiveMutation.mutate({ categoryId, isActive })
					}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}
