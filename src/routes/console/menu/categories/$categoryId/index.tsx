import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConsoleError } from "@/features/console/components/console-error";
import { ItemsTable } from "@/features/console/menu/components/items-table";
import { MenuTabs } from "@/features/console/menu/components/menu-tabs";
import { getDisplayName } from "@/features/console/menu/logic/display";
import { categoryQueries } from "@/features/console/menu/queries";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute("/console/menu/categories/$categoryId/")({
	validateSearch: searchSchema,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			categoryQueries.detail(params.categoryId),
		);
	},
	component: RouteComponent,
	pendingComponent: ItemsPageSkeleton,
	errorComponent: ConsoleError,
});

function ItemsPageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="h-6 w-48 animate-pulse rounded bg-muted" />
			<div className="space-y-2">
				{Array.from({ length: 5 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton items
					<div key={i} className="h-12 animate-pulse rounded bg-muted" />
				))}
			</div>
		</div>
	);
}

function RouteComponent() {
	const { storeId } = Route.useSearch();
	const { categoryId } = Route.useParams();
	const { t } = useTranslation("menu");

	const { data: category } = useSuspenseQuery(
		categoryQueries.detail(categoryId),
	);

	const language = "de";
	const categoryName = getDisplayName(category.translations, language);

	return (
		<div className="space-y-6">
			<MenuTabs storeId={storeId} />

			<Link
				to="/console/menu"
				search={{ storeId }}
				className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" />
				{t("navigation.backToCategories")}
			</Link>

			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						{categoryName}
					</h1>
					<p className="text-muted-foreground">
						{t("pageHeaders.categoryItemsDescription", {
							categoryName,
						})}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" asChild>
						<Link
							to="/console/menu/categories/$categoryId/edit"
							params={{ categoryId }}
							search={{ storeId }}
						>
							<Pencil className="mr-2 h-4 w-4" />
							{t("titles.editCategory")}
						</Link>
					</Button>
					<Button size="sm" asChild>
						<Link
							to="/console/menu/categories/$categoryId/items/new"
							params={{ categoryId }}
							search={{ storeId }}
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("titles.addItem")}
						</Link>
					</Button>
				</div>
			</div>

			<ItemsTable
				items={category.items}
				categoryId={categoryId}
				storeId={storeId}
				language={language}
			/>
		</div>
	);
}
