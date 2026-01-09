import { daysOfWeek } from "@menuvo/trpc/schemas";
import { z } from "zod";

// Re-export for convenience
export { daysOfWeek };

export const dayLabels: Record<(typeof daysOfWeek)[number], string> = {
	monday: "Monday",
	tuesday: "Tuesday",
	wednesday: "Wednesday",
	thursday: "Thursday",
	friday: "Friday",
	saturday: "Saturday",
	sunday: "Sunday",
};

// Time format regex (HH:MM)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Single time slot schema
export const timeSlotSchema = z
	.object({
		openTime: z.string().regex(timeRegex, "Invalid time format (HH:MM)"),
		closeTime: z.string().regex(timeRegex, "Invalid time format (HH:MM)"),
	})
	.refine((data) => data.openTime < data.closeTime, {
		message: "Close time must be after open time",
		path: ["closeTime"],
	});

export type TimeSlot = z.infer<typeof timeSlotSchema>;

// Single store hour entry schema (for database)
export const storeHourSchema = z
	.object({
		id: z.string().uuid().optional(),
		dayOfWeek: z.enum(daysOfWeek),
		openTime: z.string().regex(timeRegex, "Invalid time format (HH:MM)"),
		closeTime: z.string().regex(timeRegex, "Invalid time format (HH:MM)"),
		displayOrder: z.number().int().min(0).default(0),
	})
	.refine((data) => data.openTime < data.closeTime, {
		message: "Close time must be after open time",
		path: ["closeTime"],
	});

export type StoreHourInput = z.infer<typeof storeHourSchema>;

// Day with multiple slots schema (for form)
export const dayHoursSchema = z
	.object({
		dayOfWeek: z.enum(daysOfWeek),
		isOpen: z.boolean(),
		slots: z.array(
			z.object({
				openTime: z.string(),
				closeTime: z.string(),
			}),
		),
	})
	.refine(
		(data) => {
			if (!data.isOpen) return true;
			return data.slots.length > 0;
		},
		{
			message: "At least one time slot is required when day is open",
			path: ["slots"],
		},
	)
	.refine(
		(data) => {
			if (!data.isOpen || data.slots.length === 0) return true;
			// Validate each slot has valid times
			for (const slot of data.slots) {
				if (!timeRegex.test(slot.openTime) || !timeRegex.test(slot.closeTime)) {
					return false;
				}
				if (slot.openTime >= slot.closeTime) {
					return false;
				}
			}
			return true;
		},
		{
			message: "Invalid time slots",
			path: ["slots"],
		},
	)
	.refine(
		(data) => {
			if (!data.isOpen || data.slots.length <= 1) return true;
			// Check for overlapping slots
			const sortedSlots = [...data.slots].sort((a, b) =>
				a.openTime.localeCompare(b.openTime),
			);
			for (let i = 0; i < sortedSlots.length - 1; i++) {
				if (sortedSlots[i].closeTime > sortedSlots[i + 1].openTime) {
					return false;
				}
			}
			return true;
		},
		{
			message: "Time slots cannot overlap",
			path: ["slots"],
		},
	);

export type DayHoursInput = z.infer<typeof dayHoursSchema>;

// Full week hours schema (for form)
export const weekHoursSchema = z.array(dayHoursSchema).length(7);
export type WeekHoursInput = z.infer<typeof weekHoursSchema>;

// Server function input schemas
export const getStoreHoursSchema = z.object({
	storeId: z.string().uuid(),
});

export const saveStoreHoursSchema = z.object({
	storeId: z.string().uuid(),
	hours: z.array(
		z.object({
			dayOfWeek: z.enum(daysOfWeek),
			openTime: z.string().regex(timeRegex),
			closeTime: z.string().regex(timeRegex),
			displayOrder: z.number().int().min(0),
		}),
	),
});

export type SaveStoreHoursInput = z.infer<typeof saveStoreHoursSchema>;
