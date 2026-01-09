/**
 * Hours Router
 *
 * Handles store hours procedures:
 * - Get store hours (protected)
 * - Save store hours (store owner)
 * - Delete store hour entry (store owner)
 */

import { storeHours, stores } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import {
	deleteStoreHourSchema,
	getStoreHoursSchema,
	saveStoreHoursSchema,
} from "../schemas/hours.schema.js";
import { protectedProcedure, router, storeOwnerProcedure } from "../trpc.js";

export const hoursRouter = router({
	/**
	 * Get store hours
	 * Protected: requires authenticated user and store ownership
	 */
	get: protectedProcedure
		.input(getStoreHoursSchema)
		.query(async ({ ctx, input }) => {
			// SECURITY: Verify the store belongs to the authenticated merchant
			const store = await ctx.db.query.stores.findFirst({
				where: eq(stores.id, input.storeId),
				columns: { id: true, merchantId: true },
			});

			if (!store || store.merchantId !== ctx.session.merchantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Store not found or access denied",
				});
			}

			const hours = await ctx.db.query.storeHours.findMany({
				where: eq(storeHours.storeId, input.storeId),
				orderBy: (h, { asc }) => [asc(h.dayOfWeek), asc(h.displayOrder)],
			});
			return hours;
		}),

	/**
	 * Save store hours (replace all)
	 * Store Owner: requires store ownership
	 * Validates that the store belongs to the user's merchant
	 */
	save: storeOwnerProcedure
		.input(saveStoreHoursSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the store belongs to the authenticated user's merchant
			const store = await ctx.db.query.stores.findFirst({
				where: eq(stores.id, input.storeId),
				columns: { id: true, merchantId: true },
			});

			if (!store || store.merchantId !== ctx.merchantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only modify hours for your own store",
				});
			}

			await ctx.db.transaction(async (tx) => {
				// Delete existing hours for this store
				await tx
					.delete(storeHours)
					.where(eq(storeHours.storeId, input.storeId));

				// Insert new hours if any
				if (input.hours.length > 0) {
					await tx.insert(storeHours).values(
						input.hours.map((h) => ({
							storeId: input.storeId,
							dayOfWeek: h.dayOfWeek,
							openTime: h.openTime,
							closeTime: h.closeTime,
							displayOrder: h.displayOrder,
						})),
					);
				}
			});

			// Return updated hours
			const updatedHours = await ctx.db.query.storeHours.findMany({
				where: eq(storeHours.storeId, input.storeId),
				orderBy: (h, { asc }) => [asc(h.dayOfWeek), asc(h.displayOrder)],
			});

			return updatedHours;
		}),

	/**
	 * Delete a single store hour entry
	 * Store Owner: requires store ownership
	 */
	delete: storeOwnerProcedure
		.input(deleteStoreHourSchema)
		.mutation(async ({ ctx, input }) => {
			// Find the hour entry first to verify ownership
			const hourEntry = await ctx.db.query.storeHours.findFirst({
				where: eq(storeHours.id, input.id),
				with: {
					store: {
						columns: { merchantId: true },
					},
				},
			});

			if (!hourEntry) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store hour entry not found",
				});
			}

			// Verify the store belongs to the authenticated user's merchant
			if (hourEntry.store.merchantId !== ctx.merchantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only delete hours for your own store",
				});
			}

			await ctx.db.delete(storeHours).where(eq(storeHours.id, input.id));

			return { success: true };
		}),
});
