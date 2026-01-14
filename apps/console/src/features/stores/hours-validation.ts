import { z } from "zod/v4";

export const daysOfWeek = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
] as const;

// Time format regex (HH:MM)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const dayHoursSchema = z
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
				const current = sortedSlots[i];
				const next = sortedSlots[i + 1];
				if (!current || !next) continue;
				if (current.closeTime > next.openTime) {
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
