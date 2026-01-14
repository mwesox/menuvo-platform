import { Button } from "@menuvo/ui";
import { skipToken, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { ConsoleError } from "@/features/components/console-error";
import { MenuTabs } from "@/features/menu/components/menu-tabs";
import { OptionGroupsTable } from "@/features/menu/components/option-groups-table";
import { trpcUtils, useTRPC } from "@/lib/trpc";

const searchSchema = z.object({
	storeId: z.string().optional(),
});

export const Route = createFileRoute("/_app/menu/options/")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ storeId: search.storeId }),
	loader: async ({ deps }) => {
		const stores = await trpcUtils.store.list.ensureData();

		// Auto-select store if only one exists and none selected
		const effectiveStoreId =
			deps.storeId ?? (stores.length === 1 ? stores[0]?.id : undefined);

		if (effectiveStoreId) {
			await trpcUtils.menu.options.listGroups.ensureData({
				storeId: effectiveStoreId,
			});
		}

		return { stores, effectiveStoreId };
	},
	component: RouteComponent,
	pendingComponent: OptionsPageSkeleton,
	errorComponent: ConsoleError,
});

function OptionsPageSkeleton() {
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
	const { storeId } = Route.useSearch();
	const { effectiveStoreId } = Route.useLoaderData();
	const { t } = useTranslation("menu");
	const navigate = useNavigate();
	const trpc = useTRPC();

	// Redirect to include storeId in URL if auto-selected
	useEffect(() => {
		if (!storeId && effectiveStoreId) {
			navigate({
				to: "/menu/options",
				search: { storeId: effectiveStoreId },
				replace: true,
			});
		}
	}, [storeId, effectiveStoreId, navigate]);

	// Data is already loaded in loader, this just reads from cache
	const { data: optionGroups = [] } = useQuery(
		trpc.menu.options.listGroups.queryOptions(
			effectiveStoreId ? { storeId: effectiveStoreId } : skipToken,
		),
	);

	const language = "de";

	return (
		<div className="space-y-6">
			<MenuTabs storeId={effectiveStoreId ?? ""} />

			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						{t("titles.optionGroups")}
					</h1>
					<p className="text-muted-foreground">
						{t("pageHeaders.optionGroupsDescription")}
					</p>
				</div>
				{effectiveStoreId && (
					<Button asChild>
						<Link to="/menu/options/new" search={{ storeId: effectiveStoreId }}>
							<Plus className="mr-2 h-4 w-4" />
							{t("titles.addOptionGroup")}
						</Link>
					</Button>
				)}
			</div>

			{effectiveStoreId ? (
				<OptionGroupsTable
					optionGroups={optionGroups}
					storeId={effectiveStoreId}
					language={language}
				/>
			) : (
				<div className="py-12 text-center text-muted-foreground">
					{t("emptyStates.selectStore")}
				</div>
			)}
		</div>
	);
}
