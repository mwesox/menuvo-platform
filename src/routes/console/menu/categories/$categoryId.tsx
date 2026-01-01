import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/features/console/menu/components/item-card";
import {
	categoryQueries,
	useDeleteItem,
	useToggleItemAvailable,
} from "@/features/console/menu/queries";

const searchSchema = z.object({
	storeId: z.number(),
});

export const Route = createFileRoute("/console/menu/categories/$categoryId")({
	validateSearch: searchSchema,
	loader: async ({ context, params }) => {
		const categoryId = Number.parseInt(params.categoryId, 10);
		await context.queryClient.ensureQueryData(
			categoryQueries.detail(categoryId),
		);
	},
	component: CategoryItemsPage,
});

function CategoryItemsPage() {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const { categoryId } = Route.useParams();
	const { storeId } = Route.useSearch();
	const categoryIdNum = Number.parseInt(categoryId, 10);

	const { data: category } = useSuspenseQuery(
		categoryQueries.detail(categoryIdNum),
	);
	const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

	const toggleAvailableMutation = useToggleItemAvailable(categoryIdNum);
	const deleteMutation = useDeleteItem(categoryIdNum);

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
					href: `/console/menu/items/new?categoryId=${categoryIdNum}&storeId=${storeId}`,
				}}
			/>

			{category.items.length === 0 ? (
				<div className="rounded-lg border border-dashed p-8 text-center">
					<h3 className="text-lg font-semibold">{t("cards.noItemsYet")}</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{t("cards.addFirstItem")}
					</p>
				</div>
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

			<AlertDialog
				open={deleteItemId !== null}
				onOpenChange={(open) => !open && setDeleteItemId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("titles.deleteItem")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("dialogs.deleteItemDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tCommon("buttons.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (deleteItemId) {
									deleteMutation.mutate(deleteItemId, {
										onSuccess: () => setDeleteItemId(null),
									});
								}
							}}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{tCommon("buttons.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
