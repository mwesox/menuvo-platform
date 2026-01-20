import { useMemo, useState } from "react";
import type { ServicePoint } from "../types";
import {
	filterServicePoints,
	getUniqueZones,
	type ServicePointFilters,
	type StatusFilter,
} from "../utils/filter-service-points";
import { groupByZone, type ZoneGroup } from "../utils/group-by-zone";

interface UseGroupedServicePointsOptions {
	servicePoints: ServicePoint[];
}

interface UseGroupedServicePointsResult {
	// Filtered and grouped data
	zoneGroups: ZoneGroup[];
	filteredCount: number;
	totalCount: number;

	// Filter state
	searchQuery: string;
	selectedZones: string[];
	statusFilter: StatusFilter;

	// Filter setters
	setSearchQuery: (query: string) => void;
	setSelectedZones: (zones: string[]) => void;
	setStatusFilter: (status: StatusFilter) => void;
	clearFilters: () => void;

	// Helper data
	availableZones: string[];
	hasActiveFilters: boolean;
}

export function useGroupedServicePoints({
	servicePoints,
}: UseGroupedServicePointsOptions): UseGroupedServicePointsResult {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedZones, setSelectedZones] = useState<string[]>([]);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

	const availableZones = useMemo(
		() => getUniqueZones(servicePoints),
		[servicePoints],
	);

	const filters: ServicePointFilters = useMemo(
		() => ({
			searchQuery,
			zones: selectedZones,
			status: statusFilter,
		}),
		[searchQuery, selectedZones, statusFilter],
	);

	const filteredServicePoints = useMemo(
		() => filterServicePoints(servicePoints, filters),
		[servicePoints, filters],
	);

	const zoneGroups = useMemo(
		() => groupByZone(filteredServicePoints),
		[filteredServicePoints],
	);

	const hasActiveFilters =
		searchQuery !== "" || selectedZones.length > 0 || statusFilter !== "all";

	const clearFilters = () => {
		setSearchQuery("");
		setSelectedZones([]);
		setStatusFilter("all");
	};

	return {
		zoneGroups,
		filteredCount: filteredServicePoints.length,
		totalCount: servicePoints.length,

		searchQuery,
		selectedZones,
		statusFilter,

		setSearchQuery,
		setSelectedZones,
		setStatusFilter,
		clearFilters,

		availableZones,
		hasActiveFilters,
	};
}
