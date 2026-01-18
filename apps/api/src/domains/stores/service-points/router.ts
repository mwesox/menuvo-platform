/**
 * Service Points Router
 *
 * Handles service point procedures:
 * - Service point CRUD
 * - QR code lookups
 * - Zone management
 * - Batch creation
 */

import { TRPCError } from "@trpc/server";
import {
	protectedProcedure,
	publicProcedure,
	router,
	storeOwnerProcedure,
} from "../../../trpc/trpc.js";
import {
	batchCreateServicePointsSchema,
	createServicePointSchema,
	deleteServicePointSchema,
	getServicePointByCodeSchema,
	getServicePointByIdSchema,
	getServicePointByShortCodeSchema,
	getZonesSchema,
	listServicePointsSchema,
	toggleServicePointSchema,
	toggleZoneActiveSchema,
	updateServicePointSchema,
} from "./schemas.js";

export const servicePointsRouter = router({
	/**
	 * Get all service points for a store
	 */
	list: protectedProcedure
		.input(listServicePointsSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.servicePoints.list(
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
	 * Get a single service point by ID
	 */
	getById: protectedProcedure
		.input(getServicePointByIdSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.servicePoints.getById(
					input.id,
					ctx.session.merchantId,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Service point not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("access denied")) {
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
	 * Get service point by store slug and code (public)
	 */
	getByCode: publicProcedure
		.input(getServicePointByCodeSchema)
		.query(async ({ ctx, input }) => {
			return await ctx.services.servicePoints.getByCode(
				input.storeSlug,
				input.code,
			);
		}),

	/**
	 * Get service point by short code (public)
	 */
	getByShortCode: publicProcedure
		.input(getServicePointByShortCodeSchema)
		.query(async ({ ctx, input }) => {
			return await ctx.services.servicePoints.getByShortCode(input.shortCode);
		}),

	/**
	 * Get distinct zones for a store
	 */
	getZones: protectedProcedure
		.input(getZonesSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.servicePoints.getZones(
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
	 * Create a new service point
	 */
	create: storeOwnerProcedure
		.input(createServicePointSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.servicePoints.create(
					input,
					ctx.session.merchantId,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("already exists")) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: error.message,
						});
					}
					if (error.message.includes("access denied")) {
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
	 * Update an existing service point
	 */
	update: storeOwnerProcedure
		.input(updateServicePointSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updates } = input;
			try {
				return await ctx.services.servicePoints.update(
					id,
					ctx.session.merchantId,
					updates,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Service point not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("already exists")) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: error.message,
						});
					}
					if (error.message.includes("access denied")) {
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
	 * Toggle service point active status
	 */
	toggleActive: storeOwnerProcedure
		.input(toggleServicePointSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.servicePoints.toggleActive(
					input.id,
					ctx.session.merchantId,
					input.isActive,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Service point not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("access denied")) {
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
	 * Toggle all service points in a zone
	 */
	toggleZoneActive: storeOwnerProcedure
		.input(toggleZoneActiveSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.servicePoints.toggleZoneActive(
					input.storeId,
					ctx.session.merchantId,
					input.zone,
					input.isActive,
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
	 * Delete a service point
	 */
	delete: storeOwnerProcedure
		.input(deleteServicePointSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				await ctx.services.servicePoints.delete(
					input.id,
					ctx.session.merchantId,
				);
				return { success: true };
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
	 * Batch create service points
	 */
	batchCreate: storeOwnerProcedure
		.input(batchCreateServicePointsSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.servicePoints.batchCreate(
					input,
					ctx.session.merchantId,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("already exist")) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: error.message,
						});
					}
					if (error.message.includes("access denied")) {
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

export type ServicePointsRouter = typeof servicePointsRouter;
