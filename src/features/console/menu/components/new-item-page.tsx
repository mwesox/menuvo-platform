import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { type CategoryWithItems, ItemForm } from "./item-form";

interface NewItemPageProps {
	storeId: number;
	initialCategoryId: number | null;
	categories: CategoryWithItems[];
	merchantId: number;
}

export function NewItemPage({
	storeId,
	initialCategoryId,
	categories,
	merchantId,
}: NewItemPageProps) {
	const { t } = useTranslation("menu");

	return (
		<div className="space-y-6">
			<PageActionBar
				backHref={`/console/menu?storeId=${storeId}&tab=items`}
				backLabel={t("navigation.backToItems")}
			/>

			{categories.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>{t("messages.needCategoryFirst")}</EmptyTitle>
						<EmptyDescription>
							{t("cards.selectCategoryDescription")}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button asChild>
							<Link
								to="/console/menu"
								search={{ storeId, tab: "categories" as const }}
							>
								{t("cards.goToCategories")}
							</Link>
						</Button>
					</EmptyContent>
				</Empty>
			) : (
				<ItemForm
					categories={categories}
					categoryId={initialCategoryId ?? undefined}
					storeId={storeId}
					merchantId={merchantId}
				/>
			)}
		</div>
	);
}
