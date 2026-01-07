import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ConsoleError } from "@/features/console/components/console-error";
import { MenuTabs } from "@/features/console/menu/components/menu-tabs";
import { OptionGroupsTable } from "@/features/console/menu/components/option-groups-table";
import { optionGroupQueries } from "@/features/console/menu/options.queries";
import { storeQueries } from "@/features/console/stores/queries";

const searchSchema = z.object({
	storeId: z.string().optional(),
});

export const Route = createFileRoute("/console/menu/options/")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ storeId: search.storeId }),
	loader: async ({ context, deps }) => {
		const stores = await context.queryClient.ensureQueryData(
			storeQueries.list(),
		);

		// Auto-select store if only one exists and none selected
		const effectiveStoreId =
			deps.storeId ?? (stores.length === 1 ? stores[0].id : undefined);

		if (effectiveStoreId) {
			await context.queryClient.ensureQueryData(
				optionGroupQueries.byStore(effectiveStoreId),
			);
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
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton items
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

	// Redirect to include storeId in URL if auto-selected
	useEffect(() => {
		if (!storeId && effectiveStoreId) {
			navigate({
				to: "/console/menu/options",
				search: { storeId: effectiveStoreId },
				replace: true,
			});
		}
	}, [storeId, effectiveStoreId, navigate]);

	// Data is already loaded in loader, this just reads from cache
	const { data: optionGroups = [] } = useSuspenseQuery(
		optionGroupQueries.byStore(effectiveStoreId ?? ""),
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
						<Link
							to="/console/menu/options/new"
							search={{ storeId: effectiveStoreId }}
						>
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
