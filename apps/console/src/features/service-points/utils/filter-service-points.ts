import type { ServicePoint } from "../types";

export type StatusFilter = "all" | "active" | "inactive";

export interface ServicePointFilters {
	searchQuery: string;
	zones: string[];
	status: StatusFilter;
}

/**
 * Filters service points based on search query, zones, and status.
 */
export function filterServicePoints(
	servicePoints: ServicePoint[],
	filters: ServicePointFilters,
): ServicePoint[] {
	const { searchQuery, zones, status } = filters;
	const query = searchQuery.toLowerCase().trim();

	return servicePoints.filter((sp) => {
		// Search filter - matches name, code, or zone
		if (query) {
			const matchesName = sp.name.toLowerCase().includes(query);
			const matchesCode = sp.code.toLowerCase().includes(query);
			const matchesZone = sp.zone?.toLowerCase().includes(query) ?? false;
			if (!matchesName && !matchesCode && !matchesZone) {
				return false;
			}
		}

		// Zone filter - if zones are selected, must match one
		if (zones.length > 0) {
			const spZone = sp.zone ?? "";
			if (!zones.includes(spZone)) {
				return false;
			}
		}

		// Status filter
		if (status === "active" && !sp.isActive) {
			return false;
		}
		if (status === "inactive" && sp.isActive) {
			return false;
		}

		return true;
	});
}

/**
 * Gets unique zones from service points.
 */
export function getUniqueZones(servicePoints: ServicePoint[]): string[] {
	const zones = new Set<string>();
	for (const sp of servicePoints) {
		if (sp.zone) {
			zones.add(sp.zone);
		}
	}
	return Array.from(zones).sort();
}
