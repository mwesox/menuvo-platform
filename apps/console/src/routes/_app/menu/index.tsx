import { Button } from "@menuvo/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { ConsoleError } from "@/features/components/console-error";
import { CategoriesTable } from "@/features/menu/components/categories-table";
import { MenuTabs } from "@/features/menu/components/menu-tabs";
import { StoreSelectionPrompt } from "@/features/menu/components/store-selection-prompt";
import { getCategoriesWithItemsQueryOptions } from "@/features/menu/queries";
import {
	queryClient,
	trpc,
	trpcClient,
	trpcUtils,
	useTRPC,
	useTRPCClient,
} from "@/lib/trpc";

const searchSchema = z.object({
	storeId: z.string().optional(),
});

export const Route = createFileRoute("/_app/menu/")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ storeId: search.storeId }),
	loader: async ({ deps }) => {
		const stores = await trpcUtils.store.list.ensureData();

		// Auto-select if single store, otherwise use URL param
		const effectiveStoreId =
			deps.storeId ?? (stores.length === 1 ? stores[0]?.id : undefined);

		if (effectiveStoreId) {
			await queryClient.ensureQueryData(
				getCategoriesWithItemsQueryOptions(trpc, trpcClient, effectiveStoreId),
			);
		}

		return {
			stores,
			autoSelectedStoreId: stores.length === 1 ? stores[0]?.id : undefined,
		};
	},
	component: RouteComponent,
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

function RouteComponent() {
	const search = Route.useSearch();
	const loaderData = Route.useLoaderData();
	const navigate = useNavigate();

	// Auto-redirect to include storeId in URL if auto-selected
	useEffect(() => {
		if (loaderData.autoSelectedStoreId && !search.storeId) {
			navigate({
				to: "/menu",
				search: { storeId: loaderData.autoSelectedStoreId },
				replace: true,
			});
		}
	}, [loaderData.autoSelectedStoreId, search.storeId, navigate]);

	const effectiveStoreId = search.storeId ?? loaderData.autoSelectedStoreId;

	// No stores - show empty state
	if (loaderData.stores.length === 0) {
		return <NoStoresPrompt />;
	}

	// No store selected and multiple stores - show selection
	if (!effectiveStoreId) {
		return <StoreSelectionPrompt stores={loaderData.stores} />;
	}

	// Store selected - show categories
	return <CategoriesPage storeId={effectiveStoreId} />;
}

function NoStoresPrompt() {
	const { t } = useTranslation("menu");

	return (
		<div className="flex h-full items-center justify-center">
			<div className="text-center">
				<h2 className="font-semibold text-lg">{t("emptyStates.noStores")}</h2>
				<p className="text-muted-foreground">
					{t("emptyStates.noStoresDescription")}
				</p>
			</div>
		</div>
	);
}

interface CategoriesPageProps {
	storeId: string;
}

function CategoriesPage({ storeId }: CategoriesPageProps) {
	const { t } = useTranslation("menu");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const { data: categories = [] } = useQuery(
		getCategoriesWithItemsQueryOptions(trpc, trpcClient, storeId),
	);

	// Default language for display (German primary)
	const language = "de";

	return (
		<div className="space-y-6">
			<MenuTabs storeId={storeId} />

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
					<Link to="/menu/categories/new" search={{ storeId }}>
						<Plus className="mr-2 h-4 w-4" />
						{t("titles.addCategory")}
					</Link>
				</Button>
			</div>

			<CategoriesTable
				categories={categories}
				storeId={storeId}
				language={language}
			/>
		</div>
	);
}
