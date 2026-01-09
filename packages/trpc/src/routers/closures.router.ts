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

import type { Database } from "@menuvo/db";
import { storeClosures, stores } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { Session } from "../context.js";
import {
	createClosureSchema,
	deleteClosureSchema,
	getClosureByIdSchema,
	listClosuresSchema,
	updateClosureSchema,
} from "../schemas/closures.schema.js";
import { protectedProcedure, router, storeOwnerProcedure } from "../trpc.js";

/**
 * Context type for helper functions
 */
interface HelperContext {
	db: Database;
	session: Session;
}

/**
 * Verify that the authenticated user owns the store
 */
async function requireStoreOwnership(
	ctx: HelperContext,
	storeId: string,
): Promise<void> {
	const store = await ctx.db.query.stores.findFirst({
		where: eq(stores.id, storeId),
		columns: { id: true, merchantId: true },
	});

	if (!store) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Store not found",
		});
	}

	if (store.merchantId !== ctx.session.merchantId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this store",
		});
	}
}

/**
 * Closure with store relation type
 */
type ClosureWithStore = typeof storeClosures.$inferSelect & {
	store: { merchantId: string };
};

/**
 * Verify that the authenticated user owns the closure (via store ownership)
 */
async function requireClosureOwnership(
	ctx: HelperContext,
	closureId: string,
): Promise<ClosureWithStore> {
	const closure = await ctx.db.query.storeClosures.findFirst({
		where: eq(storeClosures.id, closureId),
		with: {
			store: {
				columns: { merchantId: true },
			},
		},
	});

	if (!closure) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Closure not found",
		});
	}

	if (closure.store.merchantId !== ctx.session.merchantId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You do not have access to this closure",
		});
	}

	return closure;
}

/**
 * Get merchant ID from session or throw
 */
function getMerchantId(session: Session | undefined): string {
	if (!session?.merchantId) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Merchant ID not found in session",
		});
	}
	return session.merchantId;
}

export const closuresRouter = router({
	/**
	 * List all closures for a store
	 */
	list: protectedProcedure
		.input(listClosuresSchema)
		.query(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);

			// Verify store ownership
			await requireStoreOwnership(
				{ db: ctx.db, session: { ...ctx.session, merchantId } },
				input.storeId,
			);

			const closures = await ctx.db.query.storeClosures.findMany({
				where: eq(storeClosures.storeId, input.storeId),
				orderBy: (c, { asc }) => [asc(c.startDate)],
			});

			return closures;
		}),

	/**
	 * Get a single closure by ID
	 */
	getById: protectedProcedure
		.input(getClosureByIdSchema)
		.query(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);

			// This also verifies ownership
			const closure = await requireClosureOwnership(
				{ db: ctx.db, session: { ...ctx.session, merchantId } },
				input.id,
			);

			// Return closure without the nested store relation
			const { store: _, ...closureData } = closure;
			return closureData;
		}),

	/**
	 * Create a new closure
	 */
	create: storeOwnerProcedure
		.input(createClosureSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);

			// Verify store ownership
			await requireStoreOwnership(
				{ db: ctx.db, session: { ...ctx.session, merchantId } },
				input.storeId,
			);

			// Check for overlapping closures
			const existingClosures = await ctx.db.query.storeClosures.findMany({
				where: eq(storeClosures.storeId, input.storeId),
			});

			const newStart = new Date(input.startDate);
			const newEnd = new Date(input.endDate);

			for (const existing of existingClosures) {
				const existStart = new Date(existing.startDate);
				const existEnd = new Date(existing.endDate);

				// Check for overlap: ranges overlap if newStart <= existEnd AND newEnd >= existStart
				if (newStart <= existEnd && newEnd >= existStart) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `This closure overlaps with an existing closure (${existing.startDate} to ${existing.endDate})`,
					});
				}
			}

			const [closure] = await ctx.db
				.insert(storeClosures)
				.values({
					storeId: input.storeId,
					startDate: input.startDate,
					endDate: input.endDate,
					reason: input.reason ?? null,
				})
				.returning();

			return closure;
		}),

	/**
	 * Update an existing closure
	 */
	update: storeOwnerProcedure
		.input(updateClosureSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);

			// Verify ownership and get current closure
			const existingClosure = await requireClosureOwnership(
				{ db: ctx.db, session: { ...ctx.session, merchantId } },
				input.id,
			);

			// Determine the final dates for overlap checking
			const finalStartDate = input.startDate ?? existingClosure.startDate;
			const finalEndDate = input.endDate ?? existingClosure.endDate;

			// Validate that end date is not before start date
			if (new Date(finalEndDate) < new Date(finalStartDate)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "End date must be on or after start date",
				});
			}

			// Check for overlapping closures (excluding current closure)
			const otherClosures = await ctx.db.query.storeClosures.findMany({
				where: eq(storeClosures.storeId, existingClosure.storeId),
			});

			const newStart = new Date(finalStartDate);
			const newEnd = new Date(finalEndDate);

			for (const other of otherClosures) {
				// Skip the closure being updated
				if (other.id === input.id) continue;

				const otherStart = new Date(other.startDate);
				const otherEnd = new Date(other.endDate);

				if (newStart <= otherEnd && newEnd >= otherStart) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `This closure would overlap with an existing closure (${other.startDate} to ${other.endDate})`,
					});
				}
			}

			// Build update object with only provided fields
			const updateData: Record<string, unknown> = {};
			if (input.startDate !== undefined) {
				updateData.startDate = input.startDate;
			}
			if (input.endDate !== undefined) {
				updateData.endDate = input.endDate;
			}
			if (input.reason !== undefined) {
				updateData.reason = input.reason ?? null;
			}

			const [closure] = await ctx.db
				.update(storeClosures)
				.set(updateData)
				.where(eq(storeClosures.id, input.id))
				.returning();

			if (!closure) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Closure not found",
				});
			}

			return closure;
		}),

	/**
	 * Delete a closure
	 */
	delete: storeOwnerProcedure
		.input(deleteClosureSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);

			// Verify ownership before deletion
			await requireClosureOwnership(
				{ db: ctx.db, session: { ...ctx.session, merchantId } },
				input.id,
			);

			await ctx.db.delete(storeClosures).where(eq(storeClosures.id, input.id));

			return { success: true };
		}),
});
