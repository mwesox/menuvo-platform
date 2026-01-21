import { Button, HStack, Skeleton, VStack } from "@chakra-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { ItemsTable } from "@/features/menu/components/items-table";
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
		<VStack gap="6" align="stretch">
			<Skeleton h="6" w="48" />
			<VStack gap="2" align="stretch">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} h="12" rounded="md" />
				))}
			</VStack>
		</VStack>
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
		<>
			<PageActionBar
				breadcrumbs={[
					{
						label: t("titles.categories"),
						href: `/stores/${store.id}/menu`,
					},
					{ label: categoryName || t("emptyStates.unnamed") },
				]}
				actions={
					<HStack gap="2">
						<Button variant="outline" size="sm" asChild>
							<Link
								to="/stores/$storeId/menu/categories/$categoryId/edit"
								params={{ storeId: store.id, categoryId }}
							>
								<Pencil
									style={{
										marginRight: "0.5rem",
										height: "1rem",
										width: "1rem",
									}}
								/>
								{t("titles.editCategory")}
							</Link>
						</Button>
						<Button size="sm" asChild>
							<Link
								to="/stores/$storeId/menu/categories/$categoryId/items/new"
								params={{ storeId: store.id, categoryId }}
							>
								<Plus
									style={{
										marginRight: "0.5rem",
										height: "1rem",
										width: "1rem",
									}}
								/>
								{t("titles.addItem")}
							</Link>
						</Button>
					</HStack>
				}
			/>

			<ItemsTable
				items={category.items}
				categoryId={categoryId}
				storeId={store.id}
				language={language}
			/>
		</>
	);
}
