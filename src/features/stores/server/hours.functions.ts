import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { storeHours } from "@/db/schema";
import { getStoreHoursSchema, saveStoreHoursSchema } from "../hours-validation";

export const getStoreHours = createServerFn({ method: "GET" })
	.inputValidator(getStoreHoursSchema)
	.handler(async ({ data }) => {
		const hours = await db.query.storeHours.findMany({
			where: eq(storeHours.storeId, data.storeId),
			orderBy: (h, { asc }) => [asc(h.dayOfWeek), asc(h.displayOrder)],
		});
		return hours;
	});

export const saveStoreHours = createServerFn({ method: "POST" })
	.inputValidator(saveStoreHoursSchema)
	.handler(async ({ data }) => {
		// Transaction: delete all existing hours, insert new ones
		await db.transaction(async (tx) => {
			// Delete existing hours for this store
			await tx.delete(storeHours).where(eq(storeHours.storeId, data.storeId));

			// Insert new hours if any
			if (data.hours.length > 0) {
				await tx.insert(storeHours).values(
					data.hours.map((h) => ({
						storeId: data.storeId,
						dayOfWeek: h.dayOfWeek,
						openTime: h.openTime,
						closeTime: h.closeTime,
						displayOrder: h.displayOrder,
					})),
				);
			}
		});

		// Return updated hours
		const updatedHours = await db.query.storeHours.findMany({
			where: eq(storeHours.storeId, data.storeId),
			orderBy: (h, { asc }) => [asc(h.dayOfWeek), asc(h.displayOrder)],
		});

		return updatedHours;
	});
