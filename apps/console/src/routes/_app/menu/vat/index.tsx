import { Button } from "@menuvo/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { StoreSelectionRequired } from "@/components/store-selection-required";
import { ConsoleError } from "@/features/components/console-error";
import { MenuTabs } from "@/features/menu/components/menu-tabs";
import { VatGroupsTable } from "@/features/menu/components/vat-groups-table";
import { trpcUtils, useTRPC } from "@/lib/trpc";

const searchSchema = z.object({
	storeId: z.string().optional(),
});

export const Route = createFileRoute("/_app/menu/vat/")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ storeId: search.storeId }),
	loader: async ({ deps }) => {
		const stores = await trpcUtils.store.list.ensureData();

		const singleStoreId = stores.length === 1 ? stores[0]?.id : undefined;
		const effectiveStoreId = deps.storeId ?? singleStoreId;

		if (effectiveStoreId) {
			await trpcUtils.menu.vat.list.ensureData();
		}

		return { stores, effectiveStoreId };
	},
	component: RouteComponent,
	pendingComponent: VatPageSkeleton,
	errorComponent: ConsoleError,
});

function VatPageSkeleton() {
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
				to: "/menu/vat",
				search: { storeId: effectiveStoreId },
				replace: true,
			});
		}
	}, [storeId, effectiveStoreId, navigate]);

	// Data is already loaded in loader, this just reads from cache
	const { data: vatGroups = [] } = useQuery(trpc.menu.vat.list.queryOptions());

	return (
		<div className="space-y-6">
			<MenuTabs storeId={effectiveStoreId ?? ""} />

			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						{t("vat.titles.vatGroups")}
					</h1>
					<p className="text-muted-foreground">
						{t("vat.pageHeaders.vatGroupsDescription")}
					</p>
				</div>
				{effectiveStoreId && (
					<Button asChild>
						<Link to="/menu/vat/new" search={{ storeId: effectiveStoreId }}>
							<Plus className="mr-2 h-4 w-4" />
							{t("vat.titles.addVatGroup")}
						</Link>
					</Button>
				)}
			</div>

			{effectiveStoreId ? (
				<VatGroupsTable vatGroups={vatGroups} storeId={effectiveStoreId} />
			) : (
				<div className="flex justify-center py-12">
					<StoreSelectionRequired />
				</div>
			)}
		</div>
	);
}
