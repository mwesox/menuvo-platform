/**
 * Hook for live urgency updates based on elapsed time.
 */

import { useEffect, useState } from "react";
import type { UrgencyLevel } from "../constants";
import {
	calculateUrgency,
	type ElapsedTimeData,
	getElapsedTimeData,
} from "../logic/urgency";

// ============================================================================
// TYPES
// ============================================================================

export interface UrgencyResult {
	/** Current urgency level */
	level: UrgencyLevel;
	/** Elapsed time data for i18n formatting */
	timeData: ElapsedTimeData;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook that provides live-updating urgency information for an order.
 * Updates every 10 seconds to show real-time elapsed time.
 *
 * @param confirmedAt - When the order was confirmed
 * @returns Object with urgency level and time data for i18n
 */
export function useUrgency(confirmedAt: Date | string | null): UrgencyResult {
	const [now, setNow] = useState(Date.now);

	// Update time every 10 seconds for live urgency display
	useEffect(() => {
		const interval = setInterval(() => {
			setNow(Date.now());
		}, 10_000);

		return () => clearInterval(interval);
	}, []);

	return {
		level: calculateUrgency(confirmedAt, now),
		timeData: getElapsedTimeData(confirmedAt, now),
	};
}

/**
 * Hook that tracks urgency for multiple orders.
 * More efficient than calling useUrgency for each order individually.
 *
 * @param confirmedAts - Array of confirmation timestamps
 * @returns Array of urgency results in same order
 */
export function useUrgencyBatch(
	confirmedAts: (Date | string | null)[],
): UrgencyResult[] {
	const [now, setNow] = useState(Date.now);

	// Update time every 10 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			setNow(Date.now());
		}, 10_000);

		return () => clearInterval(interval);
	}, []);

	return confirmedAts.map((confirmedAt) => ({
		level: calculateUrgency(confirmedAt, now),
		timeData: getElapsedTimeData(confirmedAt, now),
	}));
}
