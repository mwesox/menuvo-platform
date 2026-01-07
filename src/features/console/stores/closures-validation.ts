import { z } from "zod";

// Date format regex (YYYY-MM-DD)
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Single closure schema
export const storeClosureSchema = z
	.object({
		id: z.string().uuid().optional(),
		startDate: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
		endDate: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
		reason: z
			.string()
			.max(255, "Reason must be less than 255 characters")
			.optional(),
	})
	.refine((data) => data.endDate >= data.startDate, {
		message: "End date must be on or after start date",
		path: ["endDate"],
	});

export type StoreClosureInput = z.infer<typeof storeClosureSchema>;

// Server function input schemas
export const getStoreClosuresSchema = z.object({
	storeId: z.string().uuid(),
});

export const createStoreClosureSchema = z
	.object({
		storeId: z.string().uuid(),
		startDate: z.string().regex(dateRegex, "Invalid date format"),
		endDate: z.string().regex(dateRegex, "Invalid date format"),
		reason: z.string().max(255).optional(),
	})
	.refine((data) => data.endDate >= data.startDate, {
		message: "End date must be on or after start date",
		path: ["endDate"],
	});

export type CreateStoreClosureInput = z.infer<typeof createStoreClosureSchema>;

export const updateStoreClosureSchema = z
	.object({
		id: z.string().uuid(),
		startDate: z.string().regex(dateRegex, "Invalid date format"),
		endDate: z.string().regex(dateRegex, "Invalid date format"),
		reason: z.string().max(255).optional(),
	})
	.refine((data) => data.endDate >= data.startDate, {
		message: "End date must be on or after start date",
		path: ["endDate"],
	});

export type UpdateStoreClosureInput = z.infer<typeof updateStoreClosureSchema>;

export const deleteStoreClosureSchema = z.object({
	id: z.string().uuid(),
});

export type DeleteStoreClosureInput = z.infer<typeof deleteStoreClosureSchema>;
