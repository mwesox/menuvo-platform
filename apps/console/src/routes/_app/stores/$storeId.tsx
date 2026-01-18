import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Label,
	Switch,
} from "@menuvo/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod/v4";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { ConsoleError } from "@/features/components/console-error";
import { ServicePointsPanel } from "@/features/service-points";
import { StoreDetailContentSkeleton } from "@/features/stores/components/skeletons";
import { StoreClosuresForm } from "@/features/stores/components/store-closures-form";
import { StoreForm } from "@/features/stores/components/store-form";
import { StoreHoursForm } from "@/features/stores/components/store-hours-form";
import { StoreImageFields } from "@/features/stores/components/store-image-fields";
import { StoreOrderTypesForm } from "@/features/stores/components/store-order-types-form";
import { trpcUtils, useTRPC, useTRPCClient } from "@/lib/trpc";

const tabSchema = z.enum([
	"details",
	"hours",
	"closures",
	"order-types",
	"qr-codes",
]);
type TabValue = z.infer<typeof tabSchema>;

const searchSchema = z.object({
	tab: tabSchema.optional().default("details"),
});

export const Route = createFileRoute("/_app/stores/$storeId")({
	validateSearch: searchSchema,
	loader: async ({ params }) => {
		// Single request for store + hours + closures
		const store = await trpcUtils.store.getWithDetails.ensureData({
			storeId: params.storeId,
		});
		return store;
	},
	component: StoreDetailPage,
	errorComponent: ConsoleError,
});

/**
 * Outer component - renders tabs immediately, wraps content in Suspense
 */
function StoreDetailPage() {
	const { t } = useTranslation("stores");
	const navigate = useNavigate();
	const { storeId } = Route.useParams();
	const { tab = "details" } = Route.useSearch();

	// Use loader data (pre-fetched by loader)
	const store = Route.useLoaderData();

	const handleTabChange = (value: string) => {
		navigate({
			to: "/stores/$storeId",
			params: { storeId },
			search: { tab: value as TabValue },
		});
	};

	const tabItems = [
		{ value: "details", label: t("tabs.details") },
		{ value: "hours", label: t("tabs.hours") },
		{ value: "closures", label: t("tabs.closures") },
		{ value: "order-types", label: t("tabs.orderTypes") },
		{ value: "qr-codes", label: t("tabs.qrCodes") },
	];

	return (
		<div className="space-y-6">
			<PageActionBar
				breadcrumbs={[
					{ label: t("titles.stores"), href: "/stores" },
					{ label: store?.name ?? "..." },
				]}
				tabs={{
					items: tabItems,
					value: tab,
					onChange: handleTabChange,
				}}
			/>

			<Suspense fallback={<StoreDetailContentSkeleton />}>
				<StoreDetailContent storeId={storeId} tab={tab} />
			</Suspense>
		</div>
	);
}

/**
 * Inner component - fetches data with useQuery + suspense, renders tab content
 */
function StoreDetailContent({
	storeId,
	tab,
}: {
	storeId: string;
	tab: TabValue;
}) {
	const { t } = useTranslation("stores");
	const { t: tCommon } = useTranslation("common");
	const { t: tToasts } = useTranslation("toasts");
	const navigate = useNavigate();
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const store = Route.useLoaderData();

	if (!store) {
		return null;
	}

	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const toggleActiveMutation = useMutation({
		...trpc.store.toggleActive.mutationOptions(),
		mutationFn: async (input: { storeId: string; isActive: boolean }) =>
			trpcClient.store.toggleActive.mutate(input),
		onSuccess: (store) => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.list.queryKey(),
			});
			toast.success(
				store.isActive
					? tToasts("success.storeActivated")
					: tToasts("success.storeDeactivated"),
			);
		},
		onError: () => {
			toast.error(tToasts("error.updateStoreStatus"));
		},
	});

	const deleteMutation = useMutation({
		...trpc.store.delete.mutationOptions(),
		mutationFn: async (input: { storeId: string }) =>
			trpcClient.store.delete.mutate(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.list.queryKey(),
			});
			toast.success(tToasts("success.storeDeleted"));
			navigate({ to: "/stores" });
		},
		onError: () => {
			toast.error(tToasts("error.deleteStore"));
		},
	});

	const handleToggleActive = (checked: boolean) => {
		toggleActiveMutation.mutate({ storeId, isActive: checked });
	};

	const handleDelete = () => {
		deleteMutation.mutate({ storeId });
	};

	return (
		<>
			<div className="mt-6 space-y-6">
				{tab === "details" && (
					<>
						{/* Active Status Toggle */}
						<div className="flex items-center justify-between rounded-lg border p-4">
							<div className="space-y-0.5">
								<Label htmlFor="store-active">{t("labels.storeStatus")}</Label>
								<p className="text-muted-foreground text-sm">
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
							storeId={storeId}
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
										<p className="text-muted-foreground text-sm">
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
				{tab === "hours" && <StoreHoursForm storeId={storeId} />}
				{tab === "closures" && <StoreClosuresForm storeId={storeId} />}
				{tab === "order-types" && <StoreOrderTypesForm storeId={storeId} />}
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
		</>
	);
}
