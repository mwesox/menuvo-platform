import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/db/schema";
import { useDisplayLanguage } from "@/features/console/menu/contexts/display-language-context";
import { getDisplayName } from "@/features/console/menu/logic/display";
import { ItemForm } from "./item-form";

interface NewItemPageProps {
	storeId: number;
	initialCategoryId: number | null;
	categories: Category[];
	merchantId: number;
}

export function NewItemPage({
	storeId,
	initialCategoryId,
	categories,
	merchantId,
}: NewItemPageProps) {
	const { t } = useTranslation("menu");
	const { t: tForms } = useTranslation("forms");
	const navigate = useNavigate();
	const language = useDisplayLanguage();

	const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
		initialCategoryId,
	);

	const handleCategoryChange = (value: string) => {
		const newCategoryId = Number.parseInt(value, 10);
		setSelectedCategoryId(newCategoryId);
		// Update URL to include categoryId
		navigate({
			to: "/console/menu/items/new",
			search: { storeId, categoryId: newCategoryId },
			replace: true,
		});
	};

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
			) : !selectedCategoryId ? (
				<Card>
					<CardHeader>
						<CardTitle>{t("cards.selectCategoryTitle")}</CardTitle>
						<CardDescription>
							{t("cards.selectCategoryDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="max-w-xs space-y-2">
							<Label htmlFor="category-select">
								{tForms("fields.category")}
							</Label>
							<Select onValueChange={handleCategoryChange}>
								<SelectTrigger id="category-select">
									<SelectValue placeholder={t("labels.selectStore")} />
								</SelectTrigger>
								<SelectContent>
									{categories.map((category) => (
										<SelectItem key={category.id} value={String(category.id)}>
											{getDisplayName(category.translations, language)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>
			) : (
				<ItemForm
					categoryId={selectedCategoryId}
					storeId={storeId}
					merchantId={merchantId}
				/>
			)}
		</div>
	);
}
