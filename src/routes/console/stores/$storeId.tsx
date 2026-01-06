import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PageActionBar } from "@/components/layout/page-action-bar";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConsoleError } from "@/features/console/components/console-error";
import {
	ServicePointsPanel,
	servicePointQueries,
} from "@/features/console/service-points";
import { StoreDetailSkeleton } from "@/features/console/stores/components/skeletons";
import { StoreClosuresForm } from "@/features/console/stores/components/store-closures-form";
import { StoreForm } from "@/features/console/stores/components/store-form";
import { StoreHoursForm } from "@/features/console/stores/components/store-hours-form";
import { StoreImageFields } from "@/features/console/stores/components/store-image-fields";
import {
	storeClosuresQueries,
	storeHoursQueries,
	storeQueries,
	useDeleteStore,
	useToggleStoreActive,
} from "@/features/console/stores/queries";

const tabSchema = z.enum(["details", "hours", "closures", "qr-codes"]);
type TabValue = z.infer<typeof tabSchema>;

const searchSchema = z.object({
	tab: tabSchema.optional().default("details"),
});

export const Route = createFileRoute("/console/stores/$storeId")({
	validateSearch: searchSchema,
	loader: async ({ context, params }) => {
		const storeId = Number.parseInt(params.storeId, 10);
		// Load all tab data upfront - cached for 5 min via staleTime
		await Promise.all([
			context.queryClient.ensureQueryData(storeQueries.detail(storeId)),
			context.queryClient.ensureQueryData(storeHoursQueries.list(storeId)),
			context.queryClient.ensureQueryData(storeClosuresQueries.list(storeId)),
			context.queryClient.ensureQueryData(servicePointQueries.list(storeId)),
		]);
	},
	component: EditStorePage,
	pendingComponent: StoreDetailSkeleton,
	errorComponent: ConsoleError,
});

function EditStorePage() {
	const { t } = useTranslation("stores");
	const { t: tCommon } = useTranslation("common");
	const navigate = useNavigate();
	const { storeId } = Route.useParams();
	const { tab = "details" } = Route.useSearch();
	const storeIdNum = Number.parseInt(storeId, 10);
	const { data: store } = useSuspenseQuery(storeQueries.detail(storeIdNum));

	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const toggleActiveMutation = useToggleStoreActive();
	const deleteMutation = useDeleteStore();

	const handleTabChange = (value: string) => {
		navigate({
			to: "/console/stores/$storeId",
			params: { storeId },
			search: { tab: value as TabValue },
		});
	};

	const handleToggleActive = (checked: boolean) => {
		toggleActiveMutation.mutate({ storeId: storeIdNum, isActive: checked });
	};

	const handleDelete = () => {
		deleteMutation.mutate(storeIdNum, {
			onSuccess: () => {
				navigate({ to: "/console/stores" });
			},
		});
	};

	const tabItems = [
		{ value: "details", label: t("tabs.details") },
		{ value: "hours", label: t("tabs.hours") },
		{ value: "closures", label: t("tabs.closures") },
		{ value: "qr-codes", label: t("tabs.qrCodes") },
	];

	return (
		<div className="space-y-6">
			<PageActionBar
				backHref="/console/stores"
				backLabel={store.name}
				tabs={{
					items: tabItems,
					value: tab,
					onChange: handleTabChange,
				}}
			/>

			<div className="mt-6 space-y-6">
				{tab === "details" && (
					<>
						{/* Active Status Toggle */}
						<div className="flex items-center justify-between rounded-lg border p-4">
							<div className="space-y-0.5">
								<Label htmlFor="store-active">{t("labels.storeStatus")}</Label>
								<p className="text-sm text-muted-foreground">
									{t("descriptions.storeStatus")}
								</p>
							</div>
							<Switch
								id="store-active"
								checked={store.isActive}
								onCheckedChange={handleToggleActive}
								disabled={toggleActiveMutation.isPending}
							/>
						</div>

						<StoreForm store={store} merchantId={store.merchantId} />
						<StoreImageFields
							storeId={storeIdNum}
							merchantId={store.merchantId}
							logoUrl={store.logoUrl}
						/>

						{/* Danger Zone */}
						<Card className="border-destructive/50">
							<CardHeader>
								<CardTitle className="text-destructive">
									{t("sections.dangerZone")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<p className="font-medium">{t("labels.deleteStore")}</p>
										<p className="text-sm text-muted-foreground">
											{t("descriptions.deleteStore")}
										</p>
									</div>
									<Button
										variant="destructive"
										onClick={() => setShowDeleteDialog(true)}
									>
										<Trash2 className="me-2 h-4 w-4" />
										{tCommon("buttons.delete")}
									</Button>
								</div>
							</CardContent>
						</Card>
					</>
				)}
				{tab === "hours" && <StoreHoursForm storeId={storeIdNum} />}
				{tab === "closures" && <StoreClosuresForm storeId={storeIdNum} />}
				{tab === "qr-codes" && (
					<Suspense
						fallback={<div className="py-8 text-center">Loading...</div>}
					>
						<ServicePointsPanel store={store} />
					</Suspense>
				)}
			</div>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending
								? tCommon("states.deleting")
								: tCommon("buttons.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
