/**
 * Store Status Router
 *
 * Handles store status procedures:
 * - Get store status by slug
 * - Get available pickup time slots
 */

import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../../../trpc/trpc.js";
import {
	getAvailablePickupSlotsSchema,
	getStatusBySlugSchema,
} from "./schemas.js";

export const statusRouter = router({
	/**
	 * Get store status by slug (public)
	 * Returns whether store is currently open and next opening time
	 */
	getStatusBySlug: publicProcedure
		.input(getStatusBySlugSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.status.getStatusBySlug(input.slug);
			} catch (error) {
				if (error instanceof Error && error.message === "Store not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	/**
	 * Get available pickup time slots (public)
	 * Returns formatted time slots for the next 7 days
	 */
	getAvailablePickupSlots: publicProcedure
		.input(getAvailablePickupSlotsSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.status.getAvailablePickupSlots(
					input.slug,
					input.date,
					input.languageCode,
				);
			} catch (error) {
				if (error instanceof Error && error.message === "Store not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),
});

export type StatusRouter = typeof statusRouter;
