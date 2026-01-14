/**
 * Hours Router
 *
 * Handles store hours procedures:
 * - Get store hours (protected)
 * - Save store hours (store owner)
 * - Delete store hour entry (store owner)
 */

import { TRPCError } from "@trpc/server";
import {
	protectedProcedure,
	router,
	storeOwnerProcedure,
} from "../../../trpc/trpc.js";
import {
	deleteStoreHourSchema,
	getStoreHoursSchema,
	saveStoreHoursSchema,
} from "./schemas.js";
import type { SaveHoursInput } from "./types.js";

export const hoursRouter = router({
	/**
	 * Get store hours
	 * Protected: requires authenticated user and store ownership
	 */
	get: protectedProcedure
		.input(getStoreHoursSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.hours.get(
					input.storeId,
					ctx.session.merchantId,
				);
			} catch (error) {
				if (error instanceof Error && error.message.includes("access denied")) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	/**
	 * Save store hours (replace all)
	 * Store Owner: requires store ownership
	 * Validates that the store belongs to the user's merchant
	 */
	save: storeOwnerProcedure
		.input(saveStoreHoursSchema)
		.mutation(async ({ ctx, input }) => {
			const hoursInput: SaveHoursInput = {
				storeId: input.storeId,
				hours: input.hours,
			};

			try {
				return await ctx.services.hours.save(
					hoursInput,
					ctx.session.merchantId,
				);
			} catch (error) {
				if (error instanceof Error && error.message.includes("modify hours")) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	/**
	 * Delete a single store hour entry
	 * Store Owner: requires store ownership
	 */
	delete: storeOwnerProcedure
		.input(deleteStoreHourSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				await ctx.services.hours.delete(input.id, ctx.session.merchantId);
				return { success: true };
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Store hour entry not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("can only delete")) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),
});

export type HoursRouter = typeof hoursRouter;
