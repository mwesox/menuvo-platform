import { Button } from "@menuvo/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { MenuTabs } from "@/features/menu/components/menu-tabs";
import { OptionGroupsTable } from "@/features/menu/components/option-groups-table";
import { trpcUtils, useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_app/stores/$storeId/menu/options/")({
	loader: async ({ params }) => {
		await trpcUtils.menu.options.listGroups.ensureData({
			storeId: params.storeId,
		});
	},
	component: OptionsPage,
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

function OptionsPage() {
	const { t } = useTranslation("menu");
	const store = useStore();
	const trpc = useTRPC();

	const { data: optionGroups = [] } = useQuery(
		trpc.menu.options.listGroups.queryOptions({ storeId: store.id }),
	);

	const language = "de";

	return (
		<div className="space-y-6">
			<MenuTabs />

			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						{t("titles.optionGroups")}
					</h1>
					<p className="text-muted-foreground">
						{t("pageHeaders.optionGroupsDescription")}
					</p>
				</div>
				<Button asChild>
					<Link
						to="/stores/$storeId/menu/options/new"
						params={{ storeId: store.id }}
					>
						<Plus className="mr-2 h-4 w-4" />
						{t("titles.addOptionGroup")}
					</Link>
				</Button>
			</div>

			<OptionGroupsTable
				optionGroups={optionGroups}
				storeId={store.id}
				language={language}
			/>
		</div>
	);
}
