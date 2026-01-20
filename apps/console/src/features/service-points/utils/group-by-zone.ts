import type { ServicePoint } from "../types";

export interface ZoneGroup {
	zone: string;
	servicePoints: ServicePoint[];
	activeCount: number;
	totalCount: number;
}

const UNASSIGNED_ZONE = "__unassigned__";

/**
 * Groups service points by zone.
 * Unassigned service points (no zone) are grouped at the end.
 */
export function groupByZone(servicePoints: ServicePoint[]): ZoneGroup[] {
	const groups = new Map<string, ServicePoint[]>();

	for (const sp of servicePoints) {
		const zone = sp.zone || UNASSIGNED_ZONE;
		const existing = groups.get(zone);
		if (existing) {
			existing.push(sp);
		} else {
			groups.set(zone, [sp]);
		}
	}

	const result: ZoneGroup[] = [];
	let unassignedGroup: ZoneGroup | null = null;

	for (const [zone, points] of groups.entries()) {
		const group: ZoneGroup = {
			zone,
			servicePoints: points,
			activeCount: points.filter((sp) => sp.isActive).length,
			totalCount: points.length,
		};

		if (zone === UNASSIGNED_ZONE) {
			unassignedGroup = group;
		} else {
			result.push(group);
		}
	}

	// Sort zones alphabetically
	result.sort((a, b) => a.zone.localeCompare(b.zone));

	// Add unassigned at the end
	if (unassignedGroup) {
		result.push(unassignedGroup);
	}

	return result;
}

/**
 * Checks if a zone is the unassigned zone.
 */
export function isUnassignedZone(zone: string): boolean {
	return zone === UNASSIGNED_ZONE;
}

/**
 * Gets the display name for a zone.
 */
export function getZoneDisplayName(
	zone: string,
	unassignedLabel: string,
): string {
	return isUnassignedZone(zone) ? unassignedLabel : zone;
}
