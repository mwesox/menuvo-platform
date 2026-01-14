import type { AppRouter } from "@menuvo/api/trpc";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@menuvo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";
import { Layers, Plus, QrCode } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import type { ServicePoint, StoreSummary } from "../types.ts";
import { BatchCreateDialog } from "./batch-create-dialog.tsx";
import { QRCodeDialog } from "./qr-code-dialog.tsx";
import { ServicePointCard } from "./service-point-card.tsx";
import { ServicePointDialog } from "./service-point-dialog.tsx";

interface ServicePointsPanelProps {
	store: StoreSummary;
}

export function ServicePointsPanel({ store }: ServicePointsPanelProps) {
	const { t } = useTranslation("servicePoints");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { data: servicePoints = [] } = useQuery({
		...trpc.store.servicePoints.list.queryOptions({ storeId: store.id }),
	});
	const { data: zones = [] } = useQuery({
		...trpc.store.servicePoints.getZones.queryOptions({ storeId: store.id }),
	});

	const toggleMutation = useMutation({
		mutationKey: trpc.store.servicePoints.toggleActive.mutationKey(),
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
			trpcClient.store.servicePoints.toggleActive.mutate({ id, isActive }),
		onSuccess: async (servicePoint) => {
			await queryClient.invalidateQueries({
				queryKey: trpc.store.servicePoints.list.queryKey({ storeId: store.id }),
			});
			toast.success(
				servicePoint.isActive
					? tToasts("success.servicePointActivated")
					: tToasts("success.servicePointDeactivated"),
			);
		},
		onError: () => {
			toast.error(tToasts("error.updateServicePointStatus"));
		},
	});

	type RouterInput = inferRouterInputs<AppRouter>;
	type ToggleZoneInput =
		RouterInput["store"]["servicePoints"]["toggleZoneActive"];

	const toggleZoneMutation = useMutation({
		mutationKey: trpc.store.servicePoints.toggleZoneActive.mutationKey(),
		mutationFn: (input: Omit<ToggleZoneInput, "storeId">) =>
			trpcClient.store.servicePoints.toggleZoneActive.mutate({
				...input,
				storeId: store.id,
			}),
		onSuccess: async (result) => {
			await queryClient.invalidateQueries({
				queryKey: trpc.store.servicePoints.list.queryKey({ storeId: store.id }),
			});
			toast.success(
				result.isActive
					? tToasts("success.zoneActivated", { count: result.count })
					: tToasts("success.zoneDeactivated", { count: result.count }),
			);
		},
		onError: () => {
			toast.error(tToasts("error.toggleZone"));
		},
	});

	const deleteMutation = useMutation({
		mutationKey: trpc.store.servicePoints.delete.mutationKey(),
		mutationFn: (input: { id: string }) =>
			trpcClient.store.servicePoints.delete.mutate(input),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: trpc.store.servicePoints.list.queryKey({ storeId: store.id }),
			});
			toast.success(tToasts("success.servicePointDeleted"));
		},
		onError: () => {
			toast.error(tToasts("error.deleteServicePoint"));
		},
	});

	// Dialog states
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [batchCreateDialogOpen, setBatchCreateDialogOpen] = useState(false);
	const [editingServicePoint, setEditingServicePoint] =
		useState<ServicePoint | null>(null);
	const [qrServicePoint, setQrServicePoint] = useState<ServicePoint | null>(
		null,
	);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const handleEdit = (sp: ServicePoint) => {
		setEditingServicePoint(sp);
	};

	const handleViewQR = (sp: ServicePoint) => {
		setQrServicePoint(sp);
	};

	const handleToggleActive = (id: string, isActive: boolean) => {
		toggleMutation.mutate({ id, isActive });
	};

	const handleDelete = (id: string) => {
		setDeleteId(id);
	};

	const confirmDelete = () => {
		if (deleteId) {
			deleteMutation.mutate({ id: deleteId });
			setDeleteId(null);
		}
	};

	const handleToggleZone = (zone: string, isActive: boolean) => {
		toggleZoneMutation.mutate({ zone, isActive });
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-lg">{t("titles.servicePoints")}</h2>
					<p className="text-muted-foreground text-sm">
						{t("descriptions.manageServicePoints")}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{zones.length > 0 && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline">
									<Layers className="me-2 size-4" />
									{t("buttons.zones")}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>{t("zone.activateZone")}</DropdownMenuLabel>
								{zones.map((zone) => (
									<DropdownMenuItem
										key={`activate-${zone}`}
										onClick={() => handleToggleZone(zone, true)}
									>
										{zone}
									</DropdownMenuItem>
								))}
								<DropdownMenuSeparator />
								<DropdownMenuLabel>
									{t("zone.deactivateZone")}
								</DropdownMenuLabel>
								{zones.map((zone) => (
									<DropdownMenuItem
										key={`deactivate-${zone}`}
										onClick={() => handleToggleZone(zone, false)}
									>
										{zone}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
					<Button
						variant="outline"
						onClick={() => setBatchCreateDialogOpen(true)}
					>
						<Plus className="me-2 size-4" />
						{t("buttons.batchCreate")}
					</Button>
					<Button onClick={() => setCreateDialogOpen(true)}>
						<Plus className="me-2 size-4" />
						{t("buttons.addServicePoint")}
					</Button>
				</div>
			</div>

			{servicePoints.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<div className="flex size-16 items-center justify-center rounded-full bg-muted">
							<QrCode className="size-8 text-muted-foreground" />
						</div>
						<h3 className="mt-4 font-semibold text-lg">
							{t("emptyStates.noServicePoints")}
						</h3>
						<p className="mt-2 text-center text-muted-foreground text-sm">
							{t("emptyStates.noServicePointsDescription")}
						</p>
						<Button className="mt-6" onClick={() => setCreateDialogOpen(true)}>
							<Plus className="me-2 size-4" />
							{t("buttons.createFirstServicePoint")}
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{servicePoints.map((sp) => (
						<ServicePointCard
							key={sp.id}
							servicePoint={sp}
							onEdit={handleEdit}
							onViewQR={handleViewQR}
							onToggleActive={handleToggleActive}
							onDelete={handleDelete}
						/>
					))}
				</div>
			)}

			{/* Create Dialog */}
			<ServicePointDialog
				open={createDialogOpen}
				onOpenChange={setCreateDialogOpen}
				storeId={store.id}
			/>

			{/* Batch Create Dialog */}
			<BatchCreateDialog
				open={batchCreateDialogOpen}
				onOpenChange={setBatchCreateDialogOpen}
				storeId={store.id}
			/>

			{/* Edit Dialog */}
			<ServicePointDialog
				open={!!editingServicePoint}
				onOpenChange={(open) => !open && setEditingServicePoint(null)}
				storeId={store.id}
				servicePoint={editingServicePoint ?? undefined}
			/>

			{/* QR Code Dialog */}
			{qrServicePoint && (
				<QRCodeDialog
					open={!!qrServicePoint}
					onOpenChange={(open) => !open && setQrServicePoint(null)}
					servicePoint={qrServicePoint}
					storeSlug={store.slug}
				/>
			)}

			{/* Delete Confirmation */}
			<AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("titles.deleteServicePoint")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("descriptions.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("buttons.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("buttons.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
