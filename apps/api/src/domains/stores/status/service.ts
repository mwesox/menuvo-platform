/**
 * Store Status Service
 *
 * Service facade for store status operations.
 */

import type { Database } from "@menuvo/db";
import { type storeClosures, type storeHours, stores } from "@menuvo/db/schema";
import { addDays, addMinutes, format, parse, startOfDay } from "date-fns";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../../errors.js";
import type { IStoreStatusService } from "./interface.js";
import type { PickupSlot, PickupSlotsResponse, StoreStatus } from "./types.js";

/**
 * Day of week mapping (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * Matches the format used in the database (lowercase)
 */
const DAY_NAMES = [
	"sunday",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
] as const;

/**
 * Store status service implementation
 */
export class StoreStatusService implements IStoreStatusService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getStatusBySlug(slug: string): Promise<StoreStatus> {
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.slug, slug),
			with: {
				hours: true,
				closures: true,
			},
		});

		if (!store) {
			throw new NotFoundError("Store not found");
		}

		return this.computeStatus(store, store.hours, store.closures);
	}

	async getAvailablePickupSlots(
		slug: string,
		date?: string,
		languageCode?: string,
	): Promise<PickupSlotsResponse> {
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.slug, slug),
			with: {
				hours: true,
				closures: true,
			},
		});

		if (!store) {
			throw new NotFoundError("Store not found");
		}

		const slots = this.generateTimeSlots(
			store,
			store.hours,
			store.closures,
			30, // minimum 30 minutes advance
			7, // 7 days ahead
			date,
			languageCode,
		);

		// Get store status to check if shop is closed
		const storeStatus = this.computeStatus(store, store.hours, store.closures);
		let filteredSlots = slots;

		// If shop is closed, filter out slots that are before or equal to nextOpenTime
		// This ensures users can only select times that will pass validation
		if (!storeStatus.isOpen && storeStatus.nextOpenTime) {
			const nextOpenDate = new Date(storeStatus.nextOpenTime);
			filteredSlots = slots.filter((slot) => {
				const slotDate = new Date(slot.datetime);
				// Only include slots strictly after nextOpenTime (matching validation logic)
				return slotDate > nextOpenDate;
			});
		}

		return { slots: filteredSlots };
	}

	/**
	 * Compute store status (isOpen, nextOpenTime)
	 */
	private computeStatus(
		store: typeof stores.$inferSelect,
		hours: (typeof storeHours.$inferSelect)[],
		closures: (typeof storeClosures.$inferSelect)[],
	): StoreStatus {
		const now = new Date();
		const timezone = store.timezone || "UTC";

		// Check if store is currently closed due to a closure period
		const isInClosure = this.isInClosurePeriod(now, closures, timezone);
		if (isInClosure) {
			const nextOpenTime = this.getNextOpenTimeAfterClosure(
				now,
				store,
				hours,
				closures,
			);
			return {
				isOpen: false,
				nextOpenTime: nextOpenTime ? nextOpenTime.toISOString() : null,
			};
		}

		// Check if store is open based on hours
		const isOpen = this.isStoreOpen(now, store, hours, closures);
		if (isOpen) {
			return {
				isOpen: true,
				nextOpenTime: null,
			};
		}

		// Store is closed, find next open time
		const nextOpenTime = this.getNextOpenTime(now, store, hours, closures);
		return {
			isOpen: false,
			nextOpenTime: nextOpenTime ? nextOpenTime.toISOString() : null,
		};
	}

	/**
	 * Check if store is currently open
	 */
	private isStoreOpen(
		now: Date,
		store: typeof stores.$inferSelect,
		hours: (typeof storeHours.$inferSelect)[],
		closures: (typeof storeClosures.$inferSelect)[],
	): boolean {
		// Check closures first
		if (this.isInClosurePeriod(now, closures, store.timezone || "UTC")) {
			return false;
		}

		// Get current day of week in store's timezone
		// Use Intl to get the day name in the store's timezone
		const dayOfWeekInTz = new Intl.DateTimeFormat("en-US", {
			timeZone: store.timezone || "UTC",
			weekday: "long",
		}).format(now);
		const dayName = dayOfWeekInTz.toLowerCase() as (typeof DAY_NAMES)[number];

		// Find hours for today
		const todayHours = hours.filter((h) => h.dayOfWeek === dayName);
		if (todayHours.length === 0) {
			return false;
		}

		// Get current time in store timezone using Intl API
		const currentTime = new Intl.DateTimeFormat("en-US", {
			timeZone: store.timezone || "UTC",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		}).format(now);

		// Check if current time is within any of today's time slots
		for (const hour of todayHours) {
			if (currentTime >= hour.openTime && currentTime < hour.closeTime) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get next opening time
	 */
	private getNextOpenTime(
		now: Date,
		store: typeof stores.$inferSelect,
		hours: (typeof storeHours.$inferSelect)[],
		closures: (typeof storeClosures.$inferSelect)[],
	): Date | null {
		const timezone = store.timezone || "UTC";
		// Get current date in store timezone
		const nowDateStr = new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(now);
		const parts = nowDateStr.split("-").map(Number);
		const year = parts[0] ?? 0;
		const month = parts[1] ?? 0;
		const day = parts[2] ?? 0;
		const nowInTz = new Date(year, month - 1, day);

		// Check next 14 days
		for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
			const checkDate = addDays(nowInTz, dayOffset);
			// Get day name in store's timezone
			const dayOfWeekInTz = new Intl.DateTimeFormat("en-US", {
				timeZone: timezone,
				weekday: "long",
			}).format(checkDate);
			const dayName = dayOfWeekInTz.toLowerCase() as (typeof DAY_NAMES)[number];

			// Skip if in closure period
			if (this.isInClosurePeriod(checkDate, closures, timezone)) {
				continue;
			}

			// Find hours for this day
			const dayHours = hours.filter((h) => h.dayOfWeek === dayName);
			if (dayHours.length === 0) {
				continue;
			}

			// Sort hours by openTime
			const sortedHours = [...dayHours].sort((a, b) =>
				a.openTime.localeCompare(b.openTime),
			);

			for (const hour of sortedHours) {
				const openDateTime = this.parseTimeForDate(
					checkDate,
					hour.openTime,
					timezone,
				);

				// If this is today and time hasn't passed yet, or it's a future day
				if (dayOffset === 0) {
					if (openDateTime > now) {
						return openDateTime;
					}
				} else {
					return openDateTime;
				}
			}
		}

		return null;
	}

	/**
	 * Get next open time after a closure period
	 */
	private getNextOpenTimeAfterClosure(
		now: Date,
		store: typeof stores.$inferSelect,
		hours: (typeof storeHours.$inferSelect)[],
		closures: (typeof storeClosures.$inferSelect)[],
	): Date | null {
		const timezone = store.timezone || "UTC";

		// Find the closure that contains now
		const activeClosure = closures.find((closure) => {
			const start = new Date(closure.startDate + "T00:00:00");
			const end = new Date(closure.endDate + "T23:59:59");
			return now >= start && now <= end;
		});

		if (!activeClosure) {
			return this.getNextOpenTime(now, store, hours, closures);
		}

		// Start checking from the day after the closure ends
		const closureEnd = new Date(activeClosure.endDate + "T23:59:59");
		return this.getNextOpenTime(closureEnd, store, hours, closures);
	}

	/**
	 * Check if a date is within a closure period
	 */
	private isInClosurePeriod(
		date: Date,
		closures: (typeof storeClosures.$inferSelect)[],
		timezone: string,
	): boolean {
		const dateStr = new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(date);

		for (const closure of closures) {
			if (dateStr >= closure.startDate && dateStr <= closure.endDate) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Generate available time slots
	 */
	private generateTimeSlots(
		store: typeof stores.$inferSelect,
		hours: (typeof storeHours.$inferSelect)[],
		closures: (typeof storeClosures.$inferSelect)[],
		minAdvanceMinutes: number,
		daysAhead: number,
		startDate?: string,
		languageCode?: string,
	): PickupSlot[] {
		const timezone = store.timezone || "UTC";
		const now = new Date();

		// Get current date/time components in store timezone
		const nowParts = new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		}).formatToParts(now);

		const getPart = (type: string) => {
			const part = nowParts.find((p) => p.type === type);
			return part ? parseInt(part.value, 10) : 0;
		};

		const year = getPart("year");
		const month = getPart("month");
		const day = getPart("day");
		const hour = getPart("hour");
		const minute = getPart("minute");
		const second = getPart("second");

		// Create a date representing "now" in store timezone
		// We'll use this to compare with slot times which are also in store timezone
		// Both slotTime and minDateTime are UTC dates representing store timezone local times
		const nowInTz = new Date(
			Date.UTC(year, month - 1, day, hour, minute, second),
		);

		// Calculate minDateTime by adding minutes
		// This represents the minimum time in store timezone
		const minDateTime = addMinutes(nowInTz, minAdvanceMinutes);

		// Parse start date if provided, otherwise use today in store timezone
		const todayInTz = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
		let currentDate = startDate
			? parse(startDate, "yyyy-MM-dd", new Date())
			: todayInTz;

		// Ensure we don't start before today in store timezone
		if (currentDate < todayInTz) {
			currentDate = todayInTz;
		}

		const slots: PickupSlot[] = [];
		const endDate = addDays(currentDate, daysAhead);

		// Generate slots for each day
		for (let date = currentDate; date <= endDate; date = addDays(date, 1)) {
			// Skip if in closure period
			if (this.isInClosurePeriod(date, closures, timezone)) {
				continue;
			}

			// Get day name in store's timezone
			const dayOfWeekInTz = new Intl.DateTimeFormat("en-US", {
				timeZone: timezone,
				weekday: "long",
			}).format(date);
			const dayName = dayOfWeekInTz.toLowerCase() as (typeof DAY_NAMES)[number];

			// Find hours for this day
			const dayHours = hours.filter((h) => h.dayOfWeek === dayName);
			if (dayHours.length === 0) {
				continue;
			}

			// Generate 15-minute slots for each time range
			for (const hour of dayHours) {
				const openDateTime = this.parseTimeForDate(
					date,
					hour.openTime,
					timezone,
				);
				const closeDateTime = this.parseTimeForDate(
					date,
					hour.closeTime,
					timezone,
				);

				// Generate slots in 15-minute intervals
				for (
					let slotTime = openDateTime;
					slotTime < closeDateTime;
					slotTime = addMinutes(slotTime, 15)
				) {
					// Only include slots that are at least minAdvanceMinutes in the future
					// Compare in same timezone context (both are UTC dates representing store timezone times)
					if (slotTime >= minDateTime) {
						const label = this.formatSlotLabel(
							slotTime,
							nowInTz,
							timezone,
							languageCode,
						);
						slots.push({
							datetime: slotTime.toISOString(),
							label,
						});
					}
				}
			}
		}

		return slots;
	}

	/**
	 * Parse a time string (HH:MM) for a specific date in a timezone
	 * Returns a Date object in UTC representing that local time in the store's timezone
	 *
	 * Uses a simple approach: creates date assuming UTC, then adjusts based on timezone offset
	 */
	private parseTimeForDate(
		date: Date,
		timeStr: string,
		timezone: string,
	): Date {
		// Get date string in store timezone
		const dateStr = new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(date);
		const [hour, minute] = timeStr.split(":").map(Number);
		const [year, month, day] = dateStr.split("-").map(Number);

		// Create a date string in ISO format
		const isoString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;

		// Create date assuming it's in UTC, then adjust for timezone
		// We'll use a workaround: create the date and calculate offset
		const tempDate = new Date(isoString + "Z");

		// Get what this UTC time represents in the store's timezone
		const tzFormatter = new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});

		const tzParts = tzFormatter.formatToParts(tempDate);
		const tzYear = parseInt(
			tzParts.find((p) => p.type === "year")?.value || "0",
			10,
		);
		const tzMonth = parseInt(
			tzParts.find((p) => p.type === "month")?.value || "0",
			10,
		);
		const tzDay = parseInt(
			tzParts.find((p) => p.type === "day")?.value || "0",
			10,
		);
		const tzHour = parseInt(
			tzParts.find((p) => p.type === "hour")?.value || "0",
			10,
		);
		const tzMinute = parseInt(
			tzParts.find((p) => p.type === "minute")?.value || "0",
			10,
		);

		// Calculate the offset by comparing what we want vs what we got
		// We want the UTC time that represents the local time in the store's timezone
		const desiredLocalTime = new Date(
			Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, hour, minute),
		);
		const actualLocalTime = new Date(
			Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute),
		);
		const offset = desiredLocalTime.getTime() - actualLocalTime.getTime();

		return new Date(tempDate.getTime() + offset);
	}

	/**
	 * Format slot label (e.g., "Today, 14:30", "Tomorrow, 10:00", "Monday, 09:15")
	 * Compares days in store timezone and uses locale for day names
	 */
	private formatSlotLabel(
		slotTime: Date,
		nowInTz: Date,
		timezone: string,
		languageCode?: string,
	): string {
		// Get dates in store timezone for comparison
		const todayStr = new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(nowInTz);

		const slotDateStr = new Intl.DateTimeFormat("en-CA", {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(slotTime);

		// Parse to compare dates
		const todayParts = todayStr.split("-").map(Number);
		const slotParts = slotDateStr.split("-").map(Number);

		const todayYear = todayParts[0] ?? 0;
		const todayMonth = todayParts[1] ?? 0;
		const todayDay = todayParts[2] ?? 0;
		const slotYear = slotParts[0] ?? 0;
		const slotMonth = slotParts[1] ?? 0;
		const slotDay = slotParts[2] ?? 0;

		const today = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay));
		const slotDayDate = new Date(Date.UTC(slotYear, slotMonth - 1, slotDay));
		const tomorrow = addDays(today, 1);

		// Determine locale for translations
		const locale = languageCode === "de" ? "de-DE" : "en-US";

		// Format time in store timezone
		const timeStr = new Intl.DateTimeFormat("en-US", {
			timeZone: timezone,
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		}).format(slotTime);

		// Format date in store timezone
		const dateStr = new Intl.DateTimeFormat(locale, {
			timeZone: timezone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(slotTime);
		const todayLabel = languageCode === "de" ? "Heute" : "Today";
		const tomorrowLabel = languageCode === "de" ? "Morgen" : "Tomorrow";

		if (slotDayDate.getTime() === today.getTime()) {
			return `${todayLabel}, ${dateStr}, ${timeStr}`;
		}
		if (slotDayDate.getTime() === tomorrow.getTime()) {
			return `${tomorrowLabel}, ${dateStr}, ${timeStr}`;
		}

		// For other days, use day name in locale
		const dayName = new Intl.DateTimeFormat(locale, {
			timeZone: timezone,
			weekday: "long",
		}).format(slotTime);

		return `${dayName}, ${dateStr}, ${timeStr}`;
	}
}
