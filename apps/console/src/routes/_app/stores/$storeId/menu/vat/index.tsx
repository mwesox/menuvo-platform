import { Button } from "@menuvo/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { MenuTabs } from "@/features/menu/components/menu-tabs";
import { VatGroupsTable } from "@/features/menu/components/vat-groups-table";
import { trpcUtils, useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_app/stores/$storeId/menu/vat/")({
	loader: async () => {
		await trpcUtils.menu.vat.list.ensureData();
	},
	component: VatPage,
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

function VatPage() {
	const { t } = useTranslation("menu");
	const store = useStore();
	const trpc = useTRPC();

	const { data: vatGroups = [] } = useQuery(trpc.menu.vat.list.queryOptions());

	return (
		<div className="space-y-6">
			<MenuTabs />

			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						{t("vat.titles.vatGroups")}
					</h1>
					<p className="text-muted-foreground">
						{t("vat.pageHeaders.vatGroupsDescription")}
					</p>
				</div>
				<Button asChild>
					<Link
						to="/stores/$storeId/menu/vat/new"
						params={{ storeId: store.id }}
					>
						<Plus className="mr-2 h-4 w-4" />
						{t("vat.titles.addVatGroup")}
					</Link>
				</Button>
			</div>

			<VatGroupsTable vatGroups={vatGroups} storeId={store.id} />
		</div>
	);
}
