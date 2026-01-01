import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StoreCard } from "@/features/console/stores/components/store-card";
import {
	storeQueries,
	useDeleteStore,
	useToggleStoreActive,
} from "@/features/console/stores/queries";

export const Route = createFileRoute("/console/stores/")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(storeQueries.list());
	},
	component: StoresPage,
});

function StoresPage() {
	const { t } = useTranslation("stores");
	const { t: tCommon } = useTranslation("common");
	const { data: stores } = useSuspenseQuery(storeQueries.list());
	const [deleteDialogStore, setDeleteDialogStore] = useState<number | null>(
		null,
	);

	const toggleActiveMutation = useToggleStoreActive();
	const deleteMutation = useDeleteStore();

	const handleDelete = (storeId: number) => {
		deleteMutation.mutate(storeId, {
			onSuccess: () => setDeleteDialogStore(null),
		});
	};

	return (
		<div>
			<PageHeader
				title={t("titles.stores")}
				description={t("descriptions.manageStores")}
				action={{ label: t("labels.addStore"), href: "/console/stores/new" }}
			/>

			{stores.length === 0 ? (
				<div className="rounded-lg border border-dashed p-12 text-center">
					<h3 className="text-lg font-semibold">{t("emptyStates.noStores")}</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{t("emptyStates.noStoresDescription")}
					</p>
				</div>
			) : (
				<div className="grid gap-6 lg:grid-cols-2">
					{stores.map((store) => (
						<StoreCard
							key={store.id}
							store={store}
							onToggleActive={(storeId, isActive) =>
								toggleActiveMutation.mutate({ storeId, isActive })
							}
							onDelete={(storeId) => setDeleteDialogStore(storeId)}
						/>
					))}
				</div>
			)}

			<AlertDialog
				open={deleteDialogStore !== null}
				onOpenChange={(open) => !open && setDeleteDialogStore(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("dialogs.deleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("dialogs.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tCommon("buttons.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								deleteDialogStore && handleDelete(deleteDialogStore)
							}
							className="bg-red-600 hover:bg-red-700"
						>
							{tCommon("buttons.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
