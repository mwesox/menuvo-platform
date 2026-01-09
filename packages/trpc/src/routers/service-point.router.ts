/**
 * Service Point Router
 *
 * Handles service point procedures:
 * - Service point CRUD
 * - QR code lookups
 * - Zone management
 * - Batch creation
 */

import { servicePoints, stores } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
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
} from "../schemas/service-point.schema.js";
import {
	protectedProcedure,
	publicProcedure,
	router,
	storeOwnerProcedure,
} from "../trpc.js";

/**
 * Generate a unique 8-character short code for QR URLs
 */
async function generateUniqueShortCode(
	// biome-ignore lint/suspicious/noExplicitAny: Context type is complex and properly typed by tRPC
	db: any,
): Promise<string> {
	const maxAttempts = 5;
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const shortCode = nanoid(8).toLowerCase();
		const existing = await db.query.servicePoints.findFirst({
			where: eq(servicePoints.shortCode, shortCode),
			columns: { id: true },
		});
		if (!existing) {
			return shortCode;
		}
	}
	throw new TRPCError({
		code: "INTERNAL_SERVER_ERROR",
		message: "Failed to generate unique short code",
	});
}

/**
 * Generate a URL-safe code from prefix and number
 */
function generateCode(prefix: string, number: number): string {
	return `${prefix.toLowerCase().replace(/\s+/g, "-")}-${number}`;
}

/**
 * Verify store ownership by merchantId
 */
async function requireStoreOwnership(
	// biome-ignore lint/suspicious/noExplicitAny: Context type is complex and properly typed by tRPC
	db: any,
	storeId: string,
	merchantId: string,
): Promise<{ id: string; merchantId: string }> {
	const store = await db.query.stores.findFirst({
		where: eq(stores.id, storeId),
		columns: { id: true, merchantId: true },
	});
	if (!store || store.merchantId !== merchantId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Store not found or access denied",
		});
	}
	return store;
}

/**
 * Verify service point ownership by merchantId
 */
async function requireServicePointOwnership(
	// biome-ignore lint/suspicious/noExplicitAny: Context type is complex and properly typed by tRPC
	db: any,
	servicePointId: string,
	merchantId: string,
): Promise<{ id: string; store: { merchantId: string } }> {
	const servicePoint = await db.query.servicePoints.findFirst({
		where: eq(servicePoints.id, servicePointId),
		with: { store: { columns: { merchantId: true } } },
	});
	if (!servicePoint || servicePoint.store.merchantId !== merchantId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Service point not found or access denied",
		});
	}
	return servicePoint;
}

export const servicePointRouter = router({
	/**
	 * Get all service points for a store
	 */
	list: protectedProcedure
		.input(listServicePointsSchema)
		.query(async ({ ctx, input }) => {
			// protectedProcedure guarantees session exists with merchantId
			const store = await requireStoreOwnership(
				ctx.db,
				input.storeId,
				ctx.session.merchantId,
			);
			return ctx.db.query.servicePoints.findMany({
				where: eq(servicePoints.storeId, store.id),
				orderBy: [asc(servicePoints.displayOrder), asc(servicePoints.name)],
			});
		}),

	/**
	 * Get a single service point by ID
	 */
	getById: protectedProcedure
		.input(getServicePointByIdSchema)
		.query(async ({ ctx, input }) => {
			// protectedProcedure guarantees session exists with merchantId
			await requireServicePointOwnership(
				ctx.db,
				input.id,
				ctx.session.merchantId,
			);

			const servicePoint = await ctx.db.query.servicePoints.findFirst({
				where: eq(servicePoints.id, input.id),
			});
			if (!servicePoint) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service point not found",
				});
			}
			return servicePoint;
		}),

	/**
	 * Get service point by store slug and code (public)
	 */
	getByCode: publicProcedure
		.input(getServicePointByCodeSchema)
		.query(async ({ ctx, input }) => {
			const store = await ctx.db.query.stores.findFirst({
				where: eq(stores.slug, input.storeSlug),
			});
			if (!store) return null;

			return ctx.db.query.servicePoints.findFirst({
				where: and(
					eq(servicePoints.storeId, store.id),
					eq(servicePoints.code, input.code),
					eq(servicePoints.isActive, true),
				),
			});
		}),

	/**
	 * Get service point by short code (public)
	 */
	getByShortCode: publicProcedure
		.input(getServicePointByShortCodeSchema)
		.query(async ({ ctx, input }) => {
			const servicePoint = await ctx.db.query.servicePoints.findFirst({
				where: eq(servicePoints.shortCode, input.shortCode),
				with: {
					store: {
						columns: {
							slug: true,
							isActive: true,
						},
					},
				},
			});

			if (!servicePoint) {
				return { status: "not_found" as const };
			}

			if (!servicePoint.store.isActive) {
				return { status: "store_inactive" as const };
			}

			if (!servicePoint.isActive) {
				return { status: "service_point_inactive" as const };
			}

			return {
				status: "active" as const,
				storeSlug: servicePoint.store.slug,
				servicePointCode: servicePoint.code,
			};
		}),

	/**
	 * Get distinct zones for a store
	 */
	getZones: protectedProcedure
		.input(getZonesSchema)
		.query(async ({ ctx, input }) => {
			// protectedProcedure guarantees session exists with merchantId
			const store = await requireStoreOwnership(
				ctx.db,
				input.storeId,
				ctx.session.merchantId,
			);
			const points = await ctx.db.query.servicePoints.findMany({
				where: eq(servicePoints.storeId, store.id),
				columns: { zone: true },
			});
			const zones = [
				...new Set(points.map((p) => p.zone).filter(Boolean) as string[]),
			];
			return zones.sort();
		}),

	/**
	 * Create a new service point
	 */
	create: storeOwnerProcedure
		.input(createServicePointSchema)
		.mutation(async ({ ctx, input }) => {
			// storeOwnerProcedure guarantees session exists with merchantId and storeId
			const store = await requireStoreOwnership(
				ctx.db,
				input.storeId,
				ctx.session.merchantId,
			);

			// Check for duplicate code within store
			const existing = await ctx.db.query.servicePoints.findFirst({
				where: and(
					eq(servicePoints.storeId, store.id),
					eq(servicePoints.code, input.code),
				),
			});
			if (existing) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "A service point with this code already exists",
				});
			}

			// Calculate next display order if not provided
			let displayOrder = input.displayOrder ?? 0;
			if (displayOrder === 0) {
				const lastPoint = await ctx.db.query.servicePoints.findFirst({
					where: eq(servicePoints.storeId, store.id),
					orderBy: (sp, { desc }) => [desc(sp.displayOrder)],
				});
				displayOrder = (lastPoint?.displayOrder ?? -1) + 1;
			}

			// Generate unique short code for QR URLs
			const shortCode = await generateUniqueShortCode(ctx.db);

			const [newServicePoint] = await ctx.db
				.insert(servicePoints)
				.values({
					storeId: store.id,
					code: input.code,
					shortCode,
					name: input.name,
					displayOrder,
					description: input.description ?? null,
					zone: input.zone ?? null,
					attributes:
						(input.attributes as Record<
							string,
							string | number | boolean
						> | null) ?? null,
				})
				.returning();

			return newServicePoint;
		}),

	/**
	 * Update an existing service point
	 */
	update: storeOwnerProcedure
		.input(updateServicePointSchema)
		.mutation(async ({ ctx, input }) => {
			// storeOwnerProcedure guarantees session exists with merchantId and storeId
			const { id, ...updates } = input;

			await requireServicePointOwnership(ctx.db, id, ctx.session.merchantId);

			// If code is being updated, check for duplicates
			if (updates.code) {
				const current = await ctx.db.query.servicePoints.findFirst({
					where: eq(servicePoints.id, id),
				});
				if (!current) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Service point not found",
					});
				}

				const existing = await ctx.db.query.servicePoints.findFirst({
					where: and(
						eq(servicePoints.storeId, current.storeId),
						eq(servicePoints.code, updates.code),
					),
				});
				if (existing && existing.id !== id) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "A service point with this code already exists",
					});
				}
			}

			const updateData: Record<string, unknown> = {};
			if (updates.code !== undefined) updateData.code = updates.code;
			if (updates.name !== undefined) updateData.name = updates.name;
			if (updates.zone !== undefined) updateData.zone = updates.zone || null;
			if (updates.description !== undefined)
				updateData.description = updates.description || null;
			if (updates.attributes !== undefined) {
				updateData.attributes = updates.attributes as Record<
					string,
					string | number | boolean
				> | null;
			}
			if (updates.displayOrder !== undefined)
				updateData.displayOrder = updates.displayOrder;

			const [updated] = await ctx.db
				.update(servicePoints)
				.set(updateData)
				.where(eq(servicePoints.id, id))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service point not found",
				});
			}

			return updated;
		}),

	/**
	 * Toggle service point active status
	 */
	toggleActive: storeOwnerProcedure
		.input(toggleServicePointSchema)
		.mutation(async ({ ctx, input }) => {
			// storeOwnerProcedure guarantees session exists with merchantId and storeId
			await requireServicePointOwnership(
				ctx.db,
				input.id,
				ctx.session.merchantId,
			);

			const [updated] = await ctx.db
				.update(servicePoints)
				.set({ isActive: input.isActive })
				.where(eq(servicePoints.id, input.id))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Service point not found",
				});
			}

			return updated;
		}),

	/**
	 * Toggle all service points in a zone
	 */
	toggleZoneActive: storeOwnerProcedure
		.input(toggleZoneActiveSchema)
		.mutation(async ({ ctx, input }) => {
			// storeOwnerProcedure guarantees session exists with merchantId and storeId
			const store = await requireStoreOwnership(
				ctx.db,
				input.storeId,
				ctx.session.merchantId,
			);

			const result = await ctx.db
				.update(servicePoints)
				.set({ isActive: input.isActive })
				.where(
					and(
						eq(servicePoints.storeId, store.id),
						eq(servicePoints.zone, input.zone),
					),
				)
				.returning();

			return { count: result.length, isActive: input.isActive };
		}),

	/**
	 * Delete a service point
	 */
	delete: storeOwnerProcedure
		.input(deleteServicePointSchema)
		.mutation(async ({ ctx, input }) => {
			// storeOwnerProcedure guarantees session exists with merchantId and storeId
			await requireServicePointOwnership(
				ctx.db,
				input.id,
				ctx.session.merchantId,
			);

			await ctx.db.delete(servicePoints).where(eq(servicePoints.id, input.id));
			return { success: true };
		}),

	/**
	 * Batch create service points
	 */
	batchCreate: storeOwnerProcedure
		.input(batchCreateServicePointsSchema)
		.mutation(async ({ ctx, input }) => {
			// storeOwnerProcedure guarantees session exists with merchantId and storeId
			const store = await requireStoreOwnership(
				ctx.db,
				input.storeId,
				ctx.session.merchantId,
			);
			const { prefix, startNumber, count, zone } = input;

			// Generate all names and codes
			const pointsToCreate = [];
			for (let i = 0; i < count; i++) {
				pointsToCreate.push({
					name: `${prefix} ${startNumber + i}`,
					code: generateCode(prefix, startNumber + i),
				});
			}

			// Check for existing codes
			const existingPoints = await ctx.db.query.servicePoints.findMany({
				where: eq(servicePoints.storeId, store.id),
				columns: { code: true },
			});
			const existingCodes = new Set(existingPoints.map((p) => p.code));

			const conflicts = pointsToCreate.filter((p) => existingCodes.has(p.code));
			if (conflicts.length > 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Service points with these codes already exist: ${conflicts.map((c) => c.code).join(", ")}`,
				});
			}

			// Calculate starting display order
			const lastPoint = await ctx.db.query.servicePoints.findFirst({
				where: eq(servicePoints.storeId, store.id),
				orderBy: (sp, { desc }) => [desc(sp.displayOrder)],
			});
			const startDisplayOrder = (lastPoint?.displayOrder ?? -1) + 1;

			// Generate unique short codes
			const shortCodes = await Promise.all(
				pointsToCreate.map(() => generateUniqueShortCode(ctx.db)),
			);

			// Bulk insert
			const values = pointsToCreate.map((p, index) => ({
				storeId: store.id,
				code: p.code,
				// biome-ignore lint/style/noNonNullAssertion: Array lengths match
				shortCode: shortCodes[index]!,
				name: p.name,
				zone: zone ?? null,
				displayOrder: startDisplayOrder + index,
				isActive: true,
			}));

			const created = await ctx.db
				.insert(servicePoints)
				.values(values)
				.returning();

			return created;
		}),
});
