import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus, QrCode } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import type { ServicePoint, Store } from "@/db/schema.ts";
import {
	servicePointQueries,
	useDeleteServicePoint,
	useToggleServicePointActive,
} from "../queries.ts";
import { QRCodeDialog } from "./qr-code-dialog.tsx";
import { ServicePointCard } from "./service-point-card.tsx";
import { ServicePointDialog } from "./service-point-dialog.tsx";

interface ServicePointsPanelProps {
	store: Store;
}

export function ServicePointsPanel({ store }: ServicePointsPanelProps) {
	const { t } = useTranslation("servicePoints");
	const { data: servicePoints } = useSuspenseQuery(
		servicePointQueries.list(store.id),
	);

	const toggleMutation = useToggleServicePointActive(store.id);
	const deleteMutation = useDeleteServicePoint(store.id);

	// Dialog states
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editingServicePoint, setEditingServicePoint] =
		useState<ServicePoint | null>(null);
	const [qrServicePoint, setQrServicePoint] = useState<ServicePoint | null>(
		null,
	);
	const [deleteId, setDeleteId] = useState<number | null>(null);

	const handleEdit = (sp: ServicePoint) => {
		setEditingServicePoint(sp);
	};

	const handleViewQR = (sp: ServicePoint) => {
		setQrServicePoint(sp);
	};

	const handleToggleActive = (id: number, isActive: boolean) => {
		toggleMutation.mutate({ id, isActive });
	};

	const handleDelete = (id: number) => {
		setDeleteId(id);
	};

	const confirmDelete = () => {
		if (deleteId) {
			deleteMutation.mutate(deleteId);
			setDeleteId(null);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">{t("titles.servicePoints")}</h2>
					<p className="text-sm text-muted-foreground">
						{t("descriptions.manageServicePoints")}
					</p>
				</div>
				<Button onClick={() => setCreateDialogOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					{t("buttons.addServicePoint")}
				</Button>
			</div>

			{servicePoints.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
							<QrCode className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="mt-4 text-lg font-semibold">
							{t("emptyStates.noServicePoints")}
						</h3>
						<p className="mt-2 text-center text-sm text-muted-foreground">
							{t("emptyStates.noServicePointsDescription")}
						</p>
						<Button className="mt-6" onClick={() => setCreateDialogOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
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
