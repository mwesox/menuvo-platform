/**
 * VAT Router
 *
 * tRPC procedures for VAT group management.
 * VAT groups are merchant-managed - each merchant defines their own.
 */

import { TRPCError } from "@trpc/server";
import { mapDomainErrorToTRPC } from "../../../trpc/error-mapper.js";
import { router, storeOwnerProcedure } from "../../../trpc/trpc.js";
import {
	createVatGroupSchema,
	deleteVatGroupSchema,
	getVatGroupSchema,
	updateVatGroupSchema,
} from "./schemas.js";

/**
 * VAT router
 *
 * Protected procedures for VAT group management.
 */
export const vatRouter = router({
	/**
	 * List all VAT groups for the current merchant.
	 */
	list: storeOwnerProcedure.query(async ({ ctx }) => {
		return ctx.services.vat.getVatGroupsForMerchant(ctx.session.merchantId);
	}),

	/**
	 * Get a VAT group by ID.
	 */
	getById: storeOwnerProcedure
		.input(getVatGroupSchema)
		.query(async ({ ctx, input }) => {
			const group = await ctx.services.vat.getVatGroupById(
				input.id,
				ctx.session.merchantId,
			);

			if (!group) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "VAT group not found",
				});
			}

			return group;
		}),

	/**
	 * Create a new VAT group.
	 */
	create: storeOwnerProcedure
		.input(createVatGroupSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.vat.create(ctx.session.merchantId, {
					code: input.code,
					name: input.name,
					description: input.description,
					rate: input.rate,
					displayOrder: input.displayOrder,
				});
			} catch (error) {
				mapDomainErrorToTRPC(error);
			}
		}),

	/**
	 * Update a VAT group.
	 */
	update: storeOwnerProcedure
		.input(updateVatGroupSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.vat.update(input.id, ctx.session.merchantId, {
					name: input.name,
					description: input.description,
					rate: input.rate,
					displayOrder: input.displayOrder,
				});
			} catch (error) {
				mapDomainErrorToTRPC(error);
			}
		}),

	/**
	 * Delete a VAT group.
	 */
	delete: storeOwnerProcedure
		.input(deleteVatGroupSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				await ctx.services.vat.delete(input.id, ctx.session.merchantId);
				return { success: true };
			} catch (error) {
				mapDomainErrorToTRPC(error);
			}
		}),
});

export type VatRouter = typeof vatRouter;
