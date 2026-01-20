import { Button } from "@menuvo/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { ItemsTable } from "@/features/menu/components/items-table";
import { MenuTabs } from "@/features/menu/components/menu-tabs";
import { getDisplayName } from "@/features/menu/logic/display";
import { trpcUtils, useTRPC } from "@/lib/trpc";

export const Route = createFileRoute(
	"/_app/stores/$storeId/menu/categories/$categoryId/",
)({
	loader: async ({ params }) => {
		return trpcUtils.menu.queries.getCategory.ensureData({
			categoryId: params.categoryId,
		});
	},
	component: CategoryPage,
	pendingComponent: CategoryPageSkeleton,
	errorComponent: ConsoleError,
});

function CategoryPageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="h-6 w-48 animate-pulse rounded bg-muted" />
			<div className="space-y-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="h-12 animate-pulse rounded bg-muted" />
				))}
			</div>
		</div>
	);
}

function CategoryPage() {
	const store = useStore();
	const { categoryId } = Route.useParams();
	const { t } = useTranslation("menu");
	const trpc = useTRPC();

	const { data: category } = useSuspenseQuery(
		trpc.menu.queries.getCategory.queryOptions({ categoryId }),
	);

	if (!category) {
		return null;
	}

	const language = "de";
	const categoryName = getDisplayName(category.translations, language);

	return (
		<div className="space-y-6">
			<MenuTabs />

			<PageActionBar
				breadcrumbs={[
					{
						label: t("titles.categories"),
						href: `/stores/${store.id}/menu`,
					},
					{ label: categoryName || t("emptyStates.unnamed") },
				]}
				actions={
					<>
						<Button variant="outline" size="sm" asChild>
							<Link
								to="/stores/$storeId/menu/categories/$categoryId/edit"
								params={{ storeId: store.id, categoryId }}
							>
								<Pencil className="mr-2 h-4 w-4" />
								{t("titles.editCategory")}
							</Link>
						</Button>
						<Button size="sm" asChild>
							<Link
								to="/stores/$storeId/menu/categories/$categoryId/items/new"
								params={{ storeId: store.id, categoryId }}
							>
								<Plus className="mr-2 h-4 w-4" />
								{t("titles.addItem")}
							</Link>
						</Button>
					</>
				}
			/>

			<ItemsTable
				items={category.items}
				categoryId={categoryId}
				storeId={store.id}
				language={language}
			/>
		</div>
	);
}
