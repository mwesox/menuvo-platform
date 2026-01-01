import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { DeleteConfirmationDialog } from "@/features/console/menu/components/dialogs/delete-confirmation-dialog";
import { ItemCard } from "@/features/console/menu/components/item-card";
import {
	categoryQueries,
	useDeleteItem,
	useToggleItemAvailable,
} from "@/features/console/menu/queries";

interface CategoryItemsPageProps {
	categoryId: number;
	storeId: number;
}

export function CategoryItemsPage({
	categoryId,
	storeId,
}: CategoryItemsPageProps) {
	const { t } = useTranslation("menu");

	const { data: category } = useSuspenseQuery(
		categoryQueries.detail(categoryId),
	);
	const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

	const toggleAvailableMutation = useToggleItemAvailable(categoryId);
	const deleteMutation = useDeleteItem(categoryId);

	const handleDeleteConfirm = () => {
		if (deleteItemId) {
			deleteMutation.mutate(deleteItemId, {
				onSuccess: () => setDeleteItemId(null),
			});
		}
	};

	return (
		<div>
			<div className="mb-4">
				<Button variant="ghost" size="sm" asChild>
					<Link to="/console/menu" search={{ storeId }}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						{t("navigation.backToCategories")}
					</Link>
				</Button>
			</div>

			<PageHeader
				title={category.name}
				description={
					category.description ??
					t("pageHeaders.categoryItemsDescription", {
						categoryName: category.name,
					})
				}
				action={{
					label: t("titles.addItem"),
					href: `/console/menu/items/new?categoryId=${categoryId}&storeId=${storeId}`,
				}}
			/>

			{category.items.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>{t("cards.noItemsYet")}</EmptyTitle>
						<EmptyDescription>{t("cards.addFirstItem")}</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{category.items.map((item) => (
						<ItemCard
							key={item.id}
							item={item}
							onToggleAvailable={(itemId, isAvailable) =>
								toggleAvailableMutation.mutate({ itemId, isAvailable })
							}
							onDelete={(itemId) => setDeleteItemId(itemId)}
						/>
					))}
				</div>
			)}

			<DeleteConfirmationDialog
				open={deleteItemId !== null}
				onOpenChange={(open) => !open && setDeleteItemId(null)}
				title={t("titles.deleteItem")}
				description={t("dialogs.deleteItemDescription")}
				onConfirm={handleDeleteConfirm}
				isDeleting={deleteMutation.isPending}
			/>
		</div>
	);
}
