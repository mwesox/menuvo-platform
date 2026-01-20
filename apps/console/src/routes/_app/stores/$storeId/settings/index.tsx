import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Switch,
} from "@menuvo/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	CalendarOff,
	Clock,
	QrCode,
	Settings,
	ShoppingBag,
	Trash2,
} from "lucide-react";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod/v4";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarPageLayout } from "@/components/layout/sidebar-page-layout";
import { ActionRow } from "@/components/ui/action-row";
import { ContentSection } from "@/components/ui/content-section";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { ServicePointsPage } from "@/features/service-points";
import { StoreDetailContentSkeleton } from "@/features/stores/components/skeletons";
import { StoreClosuresForm } from "@/features/stores/components/store-closures-form";
import { StoreDetailsForm } from "@/features/stores/components/store-details-form";
import { StoreHoursForm } from "@/features/stores/components/store-hours-form";
import { StoreOrderTypesForm } from "@/features/stores/components/store-order-types-form";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

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

export const Route = createFileRoute("/_app/stores/$storeId/settings/")({
	validateSearch: searchSchema,
	component: StoreSettingsPage,
	errorComponent: ConsoleError,
});

function StoreSettingsPage() {
	const { t } = useTranslation("stores");
	const { t: tCommon } = useTranslation("common");
	const navigate = useNavigate();
	const { storeId } = Route.useParams();
	const { tab = "details" } = Route.useSearch();
	const store = useStore();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	const handleTabChange = (value: string) => {
		navigate({
			to: "/stores/$storeId/settings",
			params: { storeId },
			search: { tab: value as TabValue },
		});
	};

	const navItems = [
		{
			value: "details",
			label: t("nav.general"),
			icon: <Settings className="h-4 w-4" />,
		},
		{
			value: "hours",
			label: t("nav.hours"),
			icon: <Clock className="h-4 w-4" />,
		},
		{
			value: "closures",
			label: t("nav.closures"),
			icon: <CalendarOff className="h-4 w-4" />,
		},
		{
			value: "order-types",
			label: t("nav.orderTypes"),
			icon: <ShoppingBag className="h-4 w-4" />,
		},
		{
			value: "qr-codes",
			label: t("nav.qrCodes"),
			icon: <QrCode className="h-4 w-4" />,
		},
	];

	return (
		<>
			<SidebarPageLayout
				nav={
					<>
						{/* Desktop: vertical nav */}
						<div className="hidden lg:block">
							<SidebarNav
								items={navItems}
								value={tab}
								onChange={handleTabChange}
								dangerItem={{
									label: t("labels.deleteStore"),
									icon: <Trash2 className="h-4 w-4" />,
									onClick: () => setShowDeleteDialog(true),
								}}
							/>
						</div>
						{/* Mobile: horizontal scroll */}
						<div className="lg:hidden">
							<SidebarNav
								items={navItems}
								value={tab}
								onChange={handleTabChange}
								layout="horizontal"
							/>
						</div>
					</>
				}
			>
				<Suspense fallback={<StoreDetailContentSkeleton />}>
					<StoreSettingsContent storeId={storeId} tab={tab} store={store} />
				</Suspense>
			</SidebarPageLayout>

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
						<DeleteStoreButton
							storeId={storeId}
							onSuccess={() => setShowDeleteDialog(false)}
						/>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

function DeleteStoreButton({
	storeId,
	onSuccess,
}: {
	storeId: string;
	onSuccess: () => void;
}) {
	const { t: tCommon } = useTranslation("common");
	const { t: tToasts } = useTranslation("toasts");
	const navigate = useNavigate();
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		...trpc.store.delete.mutationOptions(),
		mutationFn: async (input: { storeId: string }) =>
			trpcClient.store.delete.mutate(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.list.queryKey(),
			});
			toast.success(tToasts("success.storeDeleted"));
			onSuccess();
			navigate({ to: "/stores" });
		},
		onError: () => {
			toast.error(tToasts("error.deleteStore"));
		},
	});

	return (
		<AlertDialogAction
			onClick={() => deleteMutation.mutate({ storeId })}
			className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
			disabled={deleteMutation.isPending}
		>
			{deleteMutation.isPending
				? tCommon("states.deleting")
				: tCommon("buttons.delete")}
		</AlertDialogAction>
	);
}

interface StoreSettingsContentProps {
	storeId: string;
	tab: TabValue;
	store: ReturnType<typeof useStore>;
}

function StoreSettingsContent({
	storeId,
	tab,
	store,
}: StoreSettingsContentProps) {
	const { t } = useTranslation("stores");
	const { t: tCommon } = useTranslation("common");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const toggleActiveMutation = useMutation({
		...trpc.store.toggleActive.mutationOptions(),
		mutationFn: async (input: { storeId: string; isActive: boolean }) =>
			trpcClient.store.toggleActive.mutate(input),
		onSuccess: (updatedStore) => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.list.queryKey(),
			});
			toast.success(
				updatedStore.isActive
					? tToasts("success.storeActivated")
					: tToasts("success.storeDeactivated"),
			);
		},
		onError: () => {
			toast.error(tToasts("error.updateStoreStatus"));
		},
	});

	const handleToggleActive = (checked: boolean) => {
		toggleActiveMutation.mutate({ storeId, isActive: checked });
	};

	return (
		<>
			{tab === "details" && (
				<>
					{/* Store Status Toggle */}
					<ContentSection title={t("labels.storeStatus")} variant="plain">
						<ActionRow
							label={t("labels.storeActive")}
							description={t("descriptions.storeStatus")}
							action={
								<Switch
									checked={store.isActive}
									onCheckedChange={handleToggleActive}
									disabled={toggleActiveMutation.isPending}
								/>
							}
						/>
					</ContentSection>

					{/* Store Details Form */}
					<StoreDetailsForm store={store} merchantId={store.merchantId} />
				</>
			)}

			{tab === "hours" && <StoreHoursForm storeId={storeId} />}

			{tab === "closures" && <StoreClosuresForm storeId={storeId} />}

			{tab === "order-types" && <StoreOrderTypesForm storeId={storeId} />}

			{tab === "qr-codes" && (
				<Suspense
					fallback={
						<div className="py-8 text-center text-muted-foreground">
							{tCommon("states.loading")}
						</div>
					}
				>
					<ServicePointsPage store={store} />
				</Suspense>
			)}
		</>
	);
}
