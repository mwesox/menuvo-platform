import {
	Box,
	Button,
	Card,
	EmptyState,
	Flex,
	Heading,
	HStack,
	Icon,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Grid2x2Plus, Plus, QrCode, SearchX } from "lucide-react";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { DeleteConfirmationDialog } from "@/features/service-points/components/delete-confirmation-dialog";
import { ServicePointsToolbar } from "@/features/service-points/components/service-points-toolbar";
import { ZoneAccordion } from "@/features/service-points/components/zone-accordion";
import { useGroupedServicePoints } from "@/features/service-points/hooks/use-grouped-service-points";
import { useServicePointMutations } from "@/features/service-points/hooks/use-service-point-mutations";
import type { ServicePoint } from "@/features/service-points/types";
import { isUnassignedZone } from "@/features/service-points/utils/group-by-zone";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_app/stores/$storeId/service-points/")({
	component: ServicePointsListPage,
	errorComponent: ConsoleError,
});

function ServicePointsListPage() {
	return (
		<Suspense fallback={<ServicePointsListSkeleton />}>
			<ServicePointsListContent />
		</Suspense>
	);
}

function ServicePointsListSkeleton() {
	return (
		<VStack gap="6" align="stretch">
			<VStack align="start" gap="0">
				<Heading size="lg">...</Heading>
			</VStack>
		</VStack>
	);
}

function ServicePointsListContent() {
	const { t } = useTranslation("servicePoints");
	const store = useStore();
	const navigate = useNavigate();
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

	// Delete confirmation state (keep inline for simple confirmation)
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const handleEdit = (sp: ServicePoint) => {
		navigate({
			to: "/stores/$storeId/service-points/$servicePointId",
			params: { storeId: store.id, servicePointId: sp.id },
		});
	};

	const handleViewQR = (sp: ServicePoint) => {
		navigate({
			to: "/stores/$storeId/service-points/$servicePointId/qr",
			params: { storeId: store.id, servicePointId: sp.id },
		});
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
		if (!isUnassignedZone(zone)) {
			toggleZone(zone, true);
		}
	};

	const handleDeactivateZone = (zone: string) => {
		if (!isUnassignedZone(zone)) {
			toggleZone(zone, false);
		}
	};

	const handleCreateClick = () => {
		navigate({
			to: "/stores/$storeId/service-points/new",
			params: { storeId: store.id },
		});
	};

	const handleBatchCreateClick = () => {
		navigate({
			to: "/stores/$storeId/service-points/batch",
			params: { storeId: store.id },
		});
	};

	// Empty state - no service points at all
	if (totalCount === 0) {
		return (
			<VStack gap="6" align="stretch">
				<Flex
					direction={{ base: "column", md: "row" }}
					gap={{ base: "3", md: "4" }}
					align={{ md: "center" }}
					justify="space-between"
				>
					<VStack align="start" gap="0">
						<Heading size="lg">{t("titles.servicePoints")}</Heading>
						<Text color="fg.muted" textStyle="sm">
							{t("descriptions.manageServicePoints")}
						</Text>
					</VStack>
				</Flex>

				<Card.Root>
					<Card.Body>
						<EmptyState.Root>
							<EmptyState.Content>
								<EmptyState.Indicator>
									<Icon fontSize="2xl">
										<QrCode style={{ height: "2rem", width: "2rem" }} />
									</Icon>
								</EmptyState.Indicator>
								<EmptyState.Title>
									{t("emptyStates.noServicePoints")}
								</EmptyState.Title>
								<EmptyState.Description>
									{t("emptyStates.noServicePointsDescription")}
								</EmptyState.Description>
								<Link
									to="/stores/$storeId/service-points/new"
									params={{ storeId: store.id }}
								>
									<Button>
										<Plus
											style={{
												height: "1rem",
												width: "1rem",
												marginRight: "0.5rem",
											}}
										/>
										{t("buttons.createFirstServicePoint")}
									</Button>
								</Link>
							</EmptyState.Content>
						</EmptyState.Root>
					</Card.Body>
				</Card.Root>
			</VStack>
		);
	}

	return (
		<VStack gap="6" align="stretch">
			{/* Header with action buttons */}
			<Flex
				direction={{ base: "column", md: "row" }}
				gap={{ base: "3", md: "4" }}
				align={{ md: "center" }}
				justify="space-between"
			>
				<VStack align="start" gap="0">
					<Heading size="lg">{t("titles.servicePoints")}</Heading>
					<Text color="fg.muted" textStyle="sm">
						{t("descriptions.manageServicePoints")}
					</Text>
				</VStack>
				<HStack gap="2" flexShrink={0}>
					{/* Mobile: icon-only buttons with distinct icons */}
					<Box display={{ base: "block", md: "none" }}>
						<Button
							variant="outline"
							size="sm"
							w="10"
							h="10"
							p="0"
							onClick={handleBatchCreateClick}
							title={t("buttons.batchCreate")}
						>
							<Icon w="4" h="4">
								<Grid2x2Plus />
							</Icon>
						</Button>
					</Box>
					<Box display={{ base: "block", md: "none" }}>
						<Button
							size="sm"
							w="10"
							h="10"
							p="0"
							onClick={handleCreateClick}
							title={t("buttons.addServicePoint")}
						>
							<Icon w="4" h="4">
								<Plus />
							</Icon>
						</Button>
					</Box>
					{/* Desktop: full buttons */}
					<Box display={{ base: "none", md: "block" }}>
						<Button variant="outline" onClick={handleBatchCreateClick}>
							<Icon w="4" h="4" me="2">
								<Grid2x2Plus />
							</Icon>
							{t("buttons.batchCreate")}
						</Button>
					</Box>
					<Box display={{ base: "none", md: "block" }}>
						<Button onClick={handleCreateClick}>
							<Icon w="4" h="4" me="2">
								<Plus />
							</Icon>
							{t("buttons.addServicePoint")}
						</Button>
					</Box>
				</HStack>
			</Flex>

			{/* Toolbar - search and filters only */}
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
			/>

			{/* Content */}
			{filteredCount === 0 ? (
				<Card.Root>
					<Card.Body>
						<EmptyState.Root>
							<EmptyState.Content>
								<EmptyState.Indicator>
									<Icon fontSize="2xl">
										<SearchX style={{ height: "2rem", width: "2rem" }} />
									</Icon>
								</EmptyState.Indicator>
								<EmptyState.Title>{t("filters.noResults")}</EmptyState.Title>
								<Button variant="outline" onClick={clearFilters}>
									{t("filters.clearFilters")}
								</Button>
							</EmptyState.Content>
						</EmptyState.Root>
					</Card.Body>
				</Card.Root>
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

			{/* Delete Confirmation - keep inline for simplicity */}
			<DeleteConfirmationDialog
				open={!!deleteId}
				onOpenChange={() => setDeleteId(null)}
				onConfirm={confirmDelete}
			/>
		</VStack>
	);
}
