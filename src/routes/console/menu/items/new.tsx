import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ItemForm } from "@/features/menu/components/item-form";
import { categoryQueries } from "@/features/menu/queries";
import { storeQueries } from "@/features/stores/queries";

const searchSchema = z.object({
	categoryId: z.number().optional(),
	storeId: z.number(),
});

export const Route = createFileRoute("/console/menu/items/new")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ storeId: search.storeId }),
	loader: async ({ context, deps }) => {
		await Promise.all([
			context.queryClient.ensureQueryData(
				categoryQueries.byStore(deps.storeId),
			),
			context.queryClient.ensureQueryData(storeQueries.detail(deps.storeId)),
		]);
	},
	component: NewItemPage,
});

function NewItemPage() {
	const { t } = useTranslation("menu");
	const { t: tForms } = useTranslation("forms");
	const { categoryId: initialCategoryId, storeId } = Route.useSearch();
	const navigate = useNavigate();
	const { data: categories = [] } = useSuspenseQuery(
		categoryQueries.byStore(storeId),
	);
	const { data: store } = useSuspenseQuery(storeQueries.detail(storeId));

	const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
		initialCategoryId ?? null,
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
		<div>
			<div className="mb-4">
				<Button variant="ghost" size="sm" asChild>
					<Link to="/console/menu" search={{ storeId, tab: "items" as const }}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						{t("navigation.backToItems")}
					</Link>
				</Button>
			</div>

			<PageHeader
				title={t("pageHeaders.addItemTitle")}
				description={t("pageHeaders.addItemDescription")}
			/>

			{categories.length === 0 ? (
				<Card>
					<CardContent className="pt-6">
						<div className="text-center">
							<p className="text-muted-foreground">
								{t("messages.needCategoryFirst")}
							</p>
							<Button asChild className="mt-4">
								<Link
									to="/console/menu"
									search={{ storeId, tab: "categories" as const }}
								>
									{t("cards.goToCategories")}
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
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
											{category.name}
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
					merchantId={store.merchantId}
				/>
			)}
		</div>
	);
}
