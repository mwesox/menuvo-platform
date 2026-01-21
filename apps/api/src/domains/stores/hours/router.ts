/**
 * Hours Router
 *
 * Handles store hours procedures:
 * - Get store hours (protected)
 * - Save store hours (store owner) - replaces all hours at once
 *
 * Note: Individual hour deletion is not supported with JSONB storage.
 * Use save() to replace all hours at once.
 */

import { TRPCError } from "@trpc/server";
import {
	protectedProcedure,
	router,
	storeOwnerProcedure,
} from "../../../trpc/trpc.js";
import { getStoreHoursSchema, saveStoreHoursSchema } from "./schemas.js";
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
});

export type HoursRouter = typeof hoursRouter;
