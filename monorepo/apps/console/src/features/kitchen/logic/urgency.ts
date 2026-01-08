/**
 * Pure functions for calculating order urgency based on time elapsed.
 */

import {
	URGENCY_CRITICAL_MINUTES,
	URGENCY_WARNING_MINUTES,
	type UrgencyLevel,
} from "../constants";

/**
 * Calculate urgency level based on time elapsed since confirmation.
 *
 * @param confirmedAt - When the order was confirmed (payment completed)
 * @param now - Current time (defaults to Date.now(), injectable for testing)
 * @returns Urgency level: normal (0-5 min), warning (5-10 min), critical (10+ min)
 */
export function calculateUrgency(
	confirmedAt: Date | string | null,
	now: number = Date.now(),
): UrgencyLevel {
	if (!confirmedAt) return "normal";

	const confirmTime =
		typeof confirmedAt === "string"
			? new Date(confirmedAt).getTime()
			: confirmedAt.getTime();

	const minutesElapsed = (now - confirmTime) / 60_000;

	if (minutesElapsed >= URGENCY_CRITICAL_MINUTES) return "critical";
	if (minutesElapsed >= URGENCY_WARNING_MINUTES) return "warning";
	return "normal";
}

/**
 * Get Tailwind background color class for urgency level.
 */
export function getUrgencyBgColor(level: UrgencyLevel): string {
	switch (level) {
		case "critical":
			return "bg-red-500";
		case "warning":
			return "bg-yellow-500";
		default:
			return "bg-green-500";
	}
}

/**
 * Get Tailwind text color class for urgency level.
 */
export function getUrgencyTextColor(level: UrgencyLevel): string {
	switch (level) {
		case "critical":
			return "text-red-600";
		case "warning":
			return "text-yellow-600";
		default:
			return "text-green-600";
	}
}

/**
 * Get Tailwind border color class for urgency level.
 */
export function getUrgencyBorderColor(level: UrgencyLevel): string {
	switch (level) {
		case "critical":
			return "border-red-500";
		case "warning":
			return "border-yellow-500";
		default:
			return "border-green-500";
	}
}

/**
 * Elapsed time breakdown for i18n formatting.
 */
export interface ElapsedTimeData {
	type: "minutes" | "hours" | "days" | "none";
	count: number;
}

/**
 * Calculate elapsed time data for i18n formatting.
 * Returns structured data that can be passed to translation functions.
 *
 * @param confirmedAt - When the order was confirmed
 * @param now - Current time (defaults to Date.now())
 * @returns Structured time data for translation
 */
export function getElapsedTimeData(
	confirmedAt: Date | string | null,
	now: number = Date.now(),
): ElapsedTimeData {
	if (!confirmedAt) return { type: "none", count: 0 };

	const confirmTime =
		typeof confirmedAt === "string"
			? new Date(confirmedAt).getTime()
			: confirmedAt.getTime();

	const totalMinutes = Math.floor((now - confirmTime) / 60_000);

	if (totalMinutes < 0) return { type: "none", count: 0 };
	if (totalMinutes < 60) return { type: "minutes", count: totalMinutes };

	const hours = Math.floor(totalMinutes / 60);

	if (hours >= 24) {
		const days = Math.floor(hours / 24);
		return { type: "days", count: days };
	}

	return { type: "hours", count: hours };
}
