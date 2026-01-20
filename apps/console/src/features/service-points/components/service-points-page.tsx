import { Button, Card, CardContent } from "@menuvo/ui";
import { useQuery } from "@tanstack/react-query";
import { Plus, QrCode, SearchX } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTRPC } from "@/lib/trpc";
import { useGroupedServicePoints } from "../hooks/use-grouped-service-points";
import { useServicePointMutations } from "../hooks/use-service-point-mutations";
import type { ServicePoint, StoreSummary } from "../types";
import { isUnassignedZone } from "../utils/group-by-zone";
import { BatchCreateDialog } from "./batch-create-dialog";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { QRCodeDialog } from "./qr-code-dialog";
import { ServicePointDialog } from "./service-point-dialog";
import { ServicePointsToolbar } from "./service-points-toolbar";
import { ZoneAccordion } from "./zone-accordion";

interface ServicePointsPageProps {
	store: StoreSummary;
}

export function ServicePointsPage({ store }: ServicePointsPageProps) {
	const { t } = useTranslation("servicePoints");
	const trpc = useTRPC();

	const { data: servicePoints = [] } = useQuery({
		...trpc.store.servicePoints.list.queryOptions({ storeId: store.id }),
	});

	const {
		zoneGroups,
		filteredCount,
		totalCount,
		searchQuery,
		selectedZones,
		statusFilter,
		setSearchQuery,
		setSelectedZones,
		setStatusFilter,
		clearFilters,
		availableZones,
		hasActiveFilters,
	} = useGroupedServicePoints({ servicePoints });

	const { toggleActive, toggleZone, deleteServicePoint, isTogglingZone } =
		useServicePointMutations({ storeId: store.id });

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
		toggleActive(id, isActive);
	};

	const handleDelete = (id: string) => {
		setDeleteId(id);
	};

	const confirmDelete = () => {
		if (deleteId) {
			deleteServicePoint(deleteId);
			setDeleteId(null);
		}
	};

	const handleActivateZone = (zone: string) => {
		// Don't activate unassigned zone
		if (!isUnassignedZone(zone)) {
			toggleZone(zone, true);
		}
	};

	const handleDeactivateZone = (zone: string) => {
		// Don't deactivate unassigned zone
		if (!isUnassignedZone(zone)) {
			toggleZone(zone, false);
		}
	};

	// Empty state - no service points at all
	if (totalCount === 0) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-semibold text-lg">
							{t("titles.servicePoints")}
						</h2>
						<p className="text-muted-foreground text-sm">
							{t("descriptions.manageServicePoints")}
						</p>
					</div>
				</div>

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

				{/* Create Dialog */}
				<ServicePointDialog
					open={createDialogOpen}
					onOpenChange={setCreateDialogOpen}
					storeId={store.id}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="font-semibold text-lg">{t("titles.servicePoints")}</h2>
				<p className="text-muted-foreground text-sm">
					{t("descriptions.manageServicePoints")}
				</p>
			</div>

			{/* Toolbar */}
			<ServicePointsToolbar
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				statusFilter={statusFilter}
				onStatusFilterChange={setStatusFilter}
				availableZones={availableZones}
				selectedZones={selectedZones}
				onZonesChange={setSelectedZones}
				hasActiveFilters={hasActiveFilters}
				onClearFilters={clearFilters}
				onCreateClick={() => setCreateDialogOpen(true)}
				onBatchCreateClick={() => setBatchCreateDialogOpen(true)}
			/>

			{/* Content */}
			{filteredCount === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<div className="flex size-16 items-center justify-center rounded-full bg-muted">
							<SearchX className="size-8 text-muted-foreground" />
						</div>
						<h3 className="mt-4 font-semibold text-lg">
							{t("filters.noResults")}
						</h3>
						<Button variant="outline" className="mt-4" onClick={clearFilters}>
							{t("filters.clearFilters")}
						</Button>
					</CardContent>
				</Card>
			) : (
				<ZoneAccordion
					zoneGroups={zoneGroups}
					onEdit={handleEdit}
					onViewQR={handleViewQR}
					onToggleActive={handleToggleActive}
					onDelete={handleDelete}
					onActivateZone={handleActivateZone}
					onDeactivateZone={handleDeactivateZone}
					isZoneTogglePending={isTogglingZone}
				/>
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
			<DeleteConfirmationDialog
				open={!!deleteId}
				onOpenChange={() => setDeleteId(null)}
				onConfirm={confirmDelete}
			/>
		</div>
	);
}
