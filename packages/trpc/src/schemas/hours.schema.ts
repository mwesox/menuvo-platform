/**
 * Hours Schemas
 *
 * Zod schemas for store hours procedures.
 * Following the Three Schema Rule:
 * - API schemas: Typed for API contracts
 */

import { z } from "zod";

/**
 * Days of week enum matching database schema
 */
export const daysOfWeekSchema = z.enum([
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
]);

export type DayOfWeek = z.infer<typeof daysOfWeekSchema>;

/**
 * Time format validation (HH:MM)
 */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Single store hour entry - API schema
 */
export const storeHourEntrySchema = z.object({
	dayOfWeek: daysOfWeekSchema,
	openTime: z
		.string()
		.regex(timeRegex, "Time must be in HH:MM format (00:00 - 23:59)"),
	closeTime: z
		.string()
		.regex(timeRegex, "Time must be in HH:MM format (00:00 - 23:59)"),
	displayOrder: z.number().int().min(0).default(0),
});

export type StoreHourEntry = z.infer<typeof storeHourEntrySchema>;

/**
 * Get store hours - API schema
 */
export const getStoreHoursSchema = z.object({
	storeId: z.string().uuid(),
});

export type GetStoreHoursInput = z.infer<typeof getStoreHoursSchema>;

/**
 * Save store hours (replace all) - API schema
 * Used with storeOwnerProcedure, so storeId is verified from context
 */
export const saveStoreHoursSchema = z.object({
	storeId: z.string().uuid(),
	hours: z.array(storeHourEntrySchema),
});

export type SaveStoreHoursInput = z.infer<typeof saveStoreHoursSchema>;

/**
 * Delete store hour entry - API schema
 */
export const deleteStoreHourSchema = z.object({
	id: z.string().uuid(),
});

export type DeleteStoreHourInput = z.infer<typeof deleteStoreHourSchema>;
