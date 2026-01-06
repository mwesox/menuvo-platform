import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { Button } from "@/components/ui/button";
import { ConsoleError } from "@/features/console/components/console-error";
import { StoresPageSkeleton } from "@/features/console/stores/components/skeletons";
import { StoreCard } from "@/features/console/stores/components/store-card";
import { storeQueries } from "@/features/console/stores/queries";

export const Route = createFileRoute("/console/stores/")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(storeQueries.list());
	},
	component: StoresPage,
	pendingComponent: StoresPageSkeleton,
	errorComponent: ConsoleError,
});

function StoresPage() {
	const { t } = useTranslation("stores");
	const { data: stores } = useSuspenseQuery(storeQueries.list());

	return (
		<div className="space-y-6">
			<PageActionBar
				title={t("titles.stores")}
				actions={
					<Button asChild>
						<Link to="/console/stores/new">
							<Plus className="me-2 h-4 w-4" />
							{t("labels.addStore")}
						</Link>
					</Button>
				}
			/>

			{stores.length === 0 ? (
				<div className="rounded-lg border border-dashed p-12 text-center">
					<h3 className="font-semibold text-lg">{t("emptyStates.noStores")}</h3>
					<p className="mt-1 text-muted-foreground text-sm">
						{t("emptyStates.noStoresDescription")}
					</p>
				</div>
			) : (
				<div className="grid gap-6 lg:grid-cols-2">
					{stores.map((store) => (
						<StoreCard key={store.id} store={store} />
					))}
				</div>
			)}
		</div>
	);
}
