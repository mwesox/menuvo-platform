/**
 * Closures Router
 *
 * Handles store closure procedures:
 * - list: Get all closures for a store (protected)
 * - getById: Get a single closure by ID (protected)
 * - create: Create a new closure (storeOwner)
 * - update: Update an existing closure (storeOwner)
 * - delete: Delete a closure (storeOwner)
 */

import { TRPCError } from "@trpc/server";
import {
	protectedProcedure,
	router,
	storeOwnerProcedure,
} from "../../../trpc/trpc.js";
import {
	createClosureSchema,
	deleteClosureSchema,
	getClosureByIdSchema,
	listClosuresSchema,
	updateClosureSchema,
} from "./schemas.js";

export const closuresRouter = router({
	/**
	 * List all closures for a store
	 */
	list: protectedProcedure
		.input(listClosuresSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.closures.list(
					input.storeId,
					ctx.session.merchantId,
				);
			} catch (error) {
				if (error instanceof Error && error.message.includes("access")) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	/**
	 * Get a single closure by ID
	 */
	getById: protectedProcedure
		.input(getClosureByIdSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.closures.getById(
					{ storeId: input.storeId, closureId: input.id },
					ctx.session.merchantId,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Closure not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("access")) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Create a new closure
	 */
	create: storeOwnerProcedure
		.input(createClosureSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.closures.create(
					{
						storeId: input.storeId,
						startDate: input.startDate,
						endDate: input.endDate,
						reason: input.reason,
					},
					ctx.session.merchantId,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("overlaps")) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: error.message,
						});
					}
					if (error.message.includes("access")) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Update an existing closure
	 */
	update: storeOwnerProcedure
		.input(updateClosureSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.closures.update(
					{
						storeId: input.storeId,
						closureId: input.id,
						startDate: input.startDate,
						endDate: input.endDate,
						reason: input.reason,
					},
					ctx.session.merchantId,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Closure not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("access")) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: error.message,
						});
					}
					if (
						error.message.includes("overlaps") ||
						error.message.includes("End date")
					) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Delete a closure
	 */
	delete: storeOwnerProcedure
		.input(deleteClosureSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				await ctx.services.closures.delete(
					{ storeId: input.storeId, closureId: input.id },
					ctx.session.merchantId,
				);
				return { success: true };
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Closure not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("access")) {
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

export type ClosuresRouter = typeof closuresRouter;
