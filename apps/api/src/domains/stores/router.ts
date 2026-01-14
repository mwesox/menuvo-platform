/**
 * Store Router
 *
 * Handles store-related procedures:
 * - Store CRUD operations
 * - Store settings
 * - Store configuration
 */

import { stores } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router } from "../../trpc/index.js";
import { protectedProcedure, publicProcedure } from "../../trpc/trpc.js";
import { closuresRouter } from "./closures/index.js";
import { hoursRouter } from "./hours/index.js";
import {
	checkSlugAvailabilityApiSchema,
	createStoreApiSchema,
	deleteStoreApiSchema,
	getFeaturedStoresSchema,
	getStoreByIdApiSchema,
	getStoreBySlugApiSchema,
	resolveQRCodeSchema,
	searchStoresSchema,
	toggleStoreActiveApiSchema,
	updateStoreApiSchema,
	updateStoreImageApiSchema,
} from "./schemas.js";
import { servicePointsRouter } from "./service-points/index.js";
import { statusRouter } from "./status/index.js";

export const storeRouter = router({
	/**
	 * List all stores for the authenticated merchant
	 */
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.services.stores.list(ctx.session.merchantId);
	}),

	/**
	 * Get store by ID (with ownership check)
	 */
	getById: protectedProcedure
		.input(getStoreByIdApiSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.stores.getById(
					input.storeId,
					ctx.session.merchantId,
				);
			} catch (error) {
				if (error instanceof Error && error.message === "Store not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Store not found",
					});
				}
				throw error;
			}
		}),

	/**
	 * Get store with hours and closures (for store detail page)
	 * Returns all data needed for the store detail view in one query
	 */
	getWithDetails: protectedProcedure
		.input(getStoreByIdApiSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.stores.getWithDetails(
					input.storeId,
					ctx.session.merchantId,
				);
			} catch (error) {
				if (error instanceof Error && error.message === "Store not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Store not found",
					});
				}
				throw error;
			}
		}),

	/**
	 * Get store by slug (public - for shop storefront)
	 */
	getBySlug: publicProcedure
		.input(getStoreBySlugApiSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.stores.getBySlug(input.slug);
			} catch (error) {
				if (error instanceof Error && error.message === "Store not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Store not found",
					});
				}
				throw error;
			}
		}),

	/**
	 * Get unique cities where merchant has stores
	 */
	getCities: protectedProcedure.query(async ({ ctx }) => {
		return ctx.services.stores.getCities(ctx.session.merchantId);
	}),

	/**
	 * Create a new store
	 */
	create: protectedProcedure
		.input(createStoreApiSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.stores.create(ctx.session.merchantId, input);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("not found")) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (
						error.message.includes("validation") ||
						error.message.includes("invalid")
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
	 * Update store details
	 */
	update: protectedProcedure
		.input(updateStoreApiSchema)
		.mutation(async ({ ctx, input }) => {
			const { storeId, ...updates } = input;
			try {
				return await ctx.services.stores.update(
					storeId,
					ctx.session.merchantId,
					updates,
				);
			} catch (error) {
				if (error instanceof Error && error.message === "Store not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Store not found",
					});
				}
				throw error;
			}
		}),

	/**
	 * Delete a store
	 */
	delete: protectedProcedure
		.input(deleteStoreApiSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				await ctx.services.stores.delete(input.storeId, ctx.session.merchantId);
				return { success: true };
			} catch (error) {
				if (error instanceof Error && error.message === "Store not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Store not found",
					});
				}
				throw error;
			}
		}),

	/**
	 * Toggle store active status
	 */
	toggleActive: protectedProcedure
		.input(toggleStoreActiveApiSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.stores.toggleActive(
					input.storeId,
					ctx.session.merchantId,
					input.isActive,
				);
			} catch (error) {
				if (error instanceof Error && error.message === "Store not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Store not found",
					});
				}
				throw error;
			}
		}),

	/**
	 * Update store logo image URL
	 */
	updateImage: protectedProcedure
		.input(updateStoreImageApiSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.stores.updateImage(
					input.storeId,
					ctx.session.merchantId,
					input.imageUrl ?? null,
				);
			} catch (error) {
				if (error instanceof Error && error.message === "Store not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Store not found",
					});
				}
				throw error;
			}
		}),

	/**
	 * Check if a slug is available (public - for real-time validation)
	 * Takes a name, generates slug server-side, returns availability + suggestions
	 */
	checkSlugAvailability: publicProcedure
		.input(checkSlugAvailabilityApiSchema)
		.query(async ({ ctx, input }) => {
			return ctx.services.stores.checkSlugAvailability(
				input.name,
				input.storeId,
			);
		}),

	/**
	 * Search stores by name, city, or location (public)
	 */
	searchStores: publicProcedure
		.input(searchStoresSchema)
		.query(async ({ ctx, input }) => {
			return await ctx.services.stores.searchStores({
				query: input.query,
				city: input.city,
				lat: input.lat,
				lng: input.lng,
				radius: input.radius,
				limit: input.limit,
				cursor: input.cursor,
			});
		}),

	/**
	 * Get featured stores for homepage/discovery (public)
	 * Currently returns active stores; can be extended with featured flag
	 */
	getFeaturedStores: publicProcedure
		.input(getFeaturedStoresSchema)
		.query(async ({ ctx, input }) => {
			return await ctx.services.stores.getFeaturedStores({
				city: input.city,
				limit: input.limit,
			});
		}),

	/**
	 * Resolve QR code short code to store/service point (public)
	 * TODO: Implement actual QR code resolution when service points are set up
	 */
	resolveQRCode: publicProcedure
		.input(resolveQRCodeSchema)
		.query(async ({ input: _input }) => {
			// TODO: Look up QR code in database using _input.shortCode
			// For now, return not_found
			return {
				status: "not_found" as const,
				storeSlug: null as string | null,
				servicePointCode: null as string | null,
			};
		}),

	/** Service points operations */
	servicePoints: servicePointsRouter,

	/** Store hours operations */
	hours: hoursRouter,

	/** Store closures operations */
	closures: closuresRouter,

	/** Store status operations */
	status: statusRouter,
});

export type StoreRouter = typeof storeRouter;
