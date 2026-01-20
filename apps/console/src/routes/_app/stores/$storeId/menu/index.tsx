import { Button } from "@menuvo/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { CategoriesTable } from "@/features/menu/components/categories-table";
import { MenuTabs } from "@/features/menu/components/menu-tabs";
import { getCategoriesQueryOptions } from "@/features/menu/queries";
import {
	queryClient,
	trpc,
	trpcClient,
	useTRPC,
	useTRPCClient,
} from "@/lib/trpc";

export const Route = createFileRoute("/_app/stores/$storeId/menu/")({
	loader: async ({ params }) => {
		await queryClient.ensureQueryData(
			getCategoriesQueryOptions(trpc, trpcClient, params.storeId),
		);
	},
	component: CategoriesPage,
	pendingComponent: MenuPageSkeleton,
	errorComponent: ConsoleError,
});

function MenuPageSkeleton() {
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

function CategoriesPage() {
	const { t } = useTranslation("menu");
	const store = useStore();
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();

	const { data: categories = [] } = useQuery(
		getCategoriesQueryOptions(trpc, trpcClient, store.id),
	);

	const language = "de";

	return (
		<div className="space-y-6">
			<MenuTabs />

			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						{t("titles.categories")}
					</h1>
					<p className="text-muted-foreground">
						{t("pageHeaders.categoriesDescription")}
					</p>
				</div>
				<Button asChild>
					<Link
						to="/stores/$storeId/menu/categories/new"
						params={{ storeId: store.id }}
					>
						<Plus className="mr-2 h-4 w-4" />
						{t("titles.addCategory")}
					</Link>
				</Button>
			</div>

			<CategoriesTable
				categories={categories}
				storeId={store.id}
				language={language}
			/>
		</div>
	);
}
