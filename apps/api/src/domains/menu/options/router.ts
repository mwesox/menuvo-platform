/**
 * Option Router
 *
 * Handles menu option-related procedures:
 * - Option groups CRUD
 * - Option choices CRUD
 * - Item-option associations
 */

import type { ChoiceTranslations, EntityTranslations } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../../trpc/trpc.js";
import {
	createOptionChoiceSchema,
	createOptionGroupSchema,
	deleteOptionChoiceSchema,
	deleteOptionGroupSchema,
	getItemOptionsSchema,
	getOptionGroupSchema,
	listOptionChoicesSchema,
	listOptionGroupsSchema,
	saveOptionGroupWithChoicesSchema,
	toggleOptionChoiceAvailableSchema,
	toggleOptionGroupActiveSchema,
	updateItemOptionsSchema,
	updateOptionChoiceSchema,
	updateOptionGroupSchema,
} from "./schemas.js";
import { OptionsService } from "./service.js";

export const optionRouter = router({
	// ============================================================================
	// OPTION GROUPS
	// ============================================================================

	/**
	 * Get all option groups for a store
	 */
	listGroups: protectedProcedure
		.input(listOptionGroupsSchema)
		.query(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			return service.listGroups(input.storeId, ctx.session.merchantId);
		}),

	/**
	 * Get a single option group by ID
	 */
	getGroup: protectedProcedure
		.input(getOptionGroupSchema)
		.query(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			try {
				return await service.getGroup(
					input.optionGroupId,
					ctx.session.merchantId,
				);
			} catch (error) {
				if (error instanceof Error && error.message.includes("not found")) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	/**
	 * Create a new option group
	 */
	createGroup: protectedProcedure
		.input(createOptionGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			try {
				return await service.createGroup(
					input.storeId,
					ctx.session.merchantId,
					{
						translations: input.translations as EntityTranslations,
						type: input.type,
						minSelections: input.minSelections,
						maxSelections: input.maxSelections,
						isRequired: input.isRequired,
						numFreeOptions: input.numFreeOptions,
						aggregateMinQuantity: input.aggregateMinQuantity,
						aggregateMaxQuantity: input.aggregateMaxQuantity,
					},
				);
			} catch (error) {
				if (error instanceof Error) {
					if (
						error.message.includes("not found") ||
						error.message.includes("access denied")
					) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("Failed to create")) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Update an option group
	 */
	updateGroup: protectedProcedure
		.input(updateOptionGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			try {
				return await service.updateGroup(
					input.optionGroupId,
					ctx.session.merchantId,
					{
						translations: input.translations as EntityTranslations | undefined,
						type: input.type,
						minSelections: input.minSelections,
						maxSelections: input.maxSelections,
						isRequired: input.isRequired,
						numFreeOptions: input.numFreeOptions,
						aggregateMinQuantity: input.aggregateMinQuantity,
						aggregateMaxQuantity: input.aggregateMaxQuantity,
					},
				);
			} catch (error) {
				if (error instanceof Error && error.message.includes("not found")) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	/**
	 * Toggle option group active status
	 */
	toggleGroupActive: protectedProcedure
		.input(toggleOptionGroupActiveSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			try {
				return await service.toggleGroupActive(
					input.optionGroupId,
					ctx.session.merchantId,
					input.isActive,
				);
			} catch (error) {
				if (error instanceof Error && error.message.includes("not found")) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	/**
	 * Delete an option group
	 */
	deleteGroup: protectedProcedure
		.input(deleteOptionGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			try {
				await service.deleteGroup(input.optionGroupId, ctx.session.merchantId);
				return { success: true };
			} catch (error) {
				if (error instanceof Error && error.message.includes("not found")) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	/**
	 * Save option group with choices in one transaction
	 */
	saveGroupWithChoices: protectedProcedure
		.input(saveOptionGroupWithChoicesSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			try {
				return await service.saveGroupWithChoices({
					optionGroupId: input.optionGroupId,
					storeId: input.storeId,
					merchantId: ctx.session.merchantId,
					choices: input.choices.map((c) => ({
						id: c.id,
						translations: c.translations as ChoiceTranslations,
						priceModifier: c.priceModifier,
						isDefault: c.isDefault,
						minQuantity: c.minQuantity,
						maxQuantity: c.maxQuantity,
					})),
					type: input.type,
					minSelections: input.minSelections,
					maxSelections: input.maxSelections,
					numFreeOptions: input.numFreeOptions,
					aggregateMinQuantity: input.aggregateMinQuantity,
					aggregateMaxQuantity: input.aggregateMaxQuantity,
					translations: input.translations as EntityTranslations,
				});
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("not found")) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("Failed")) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	// ============================================================================
	// OPTION CHOICES
	// ============================================================================

	/**
	 * List choices for an option group
	 */
	listChoices: protectedProcedure
		.input(listOptionChoicesSchema)
		.query(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			return service.listChoices(input.optionGroupId, ctx.session.merchantId);
		}),

	/**
	 * Create a new option choice
	 */
	createChoice: protectedProcedure
		.input(createOptionChoiceSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			try {
				return await service.createChoice(
					input.optionGroupId,
					ctx.session.merchantId,
					{
						translations: input.translations as ChoiceTranslations,
						priceModifier: input.priceModifier,
						isDefault: input.isDefault,
						minQuantity: input.minQuantity,
						maxQuantity: input.maxQuantity,
					},
				);
			} catch (error) {
				if (error instanceof Error) {
					if (
						error.message.includes("not found") ||
						error.message.includes("access denied")
					) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("Failed to create")) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Update an option choice
	 */
	updateChoice: protectedProcedure
		.input(updateOptionChoiceSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			try {
				return await service.updateChoice(
					input.optionChoiceId,
					ctx.session.merchantId,
					{
						translations: input.translations as ChoiceTranslations | undefined,
						priceModifier: input.priceModifier,
						isDefault: input.isDefault,
						minQuantity: input.minQuantity,
						maxQuantity: input.maxQuantity,
					},
				);
			} catch (error) {
				if (error instanceof Error && error.message.includes("not found")) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	/**
	 * Toggle option choice available status
	 */
	toggleChoiceAvailable: protectedProcedure
		.input(toggleOptionChoiceAvailableSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			try {
				return await service.toggleChoiceAvailable(
					input.optionChoiceId,
					ctx.session.merchantId,
					input.isAvailable,
				);
			} catch (error) {
				if (error instanceof Error && error.message.includes("not found")) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	/**
	 * Delete an option choice
	 */
	deleteChoice: protectedProcedure
		.input(deleteOptionChoiceSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			try {
				await service.deleteChoice(
					input.optionChoiceId,
					ctx.session.merchantId,
				);
				return { success: true };
			} catch (error) {
				if (error instanceof Error && error.message.includes("not found")) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	// ============================================================================
	// ITEM OPTIONS (Many-to-Many)
	// ============================================================================

	/**
	 * Get option groups for an item
	 */
	getItemOptions: protectedProcedure
		.input(getItemOptionsSchema)
		.query(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			try {
				return await service.getItemOptions(
					input.itemId,
					ctx.session.merchantId,
				);
			} catch (error) {
				if (error instanceof Error && error.message.includes("not found")) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	/**
	 * Update option groups for an item
	 */
	updateItemOptions: protectedProcedure
		.input(updateItemOptionsSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new OptionsService(ctx.db);
			try {
				return await service.updateItemOptions(
					input.itemId,
					ctx.session.merchantId,
					input.optionGroupIds,
				);
			} catch (error) {
				if (error instanceof Error && error.message.includes("not found")) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),
});

export type OptionRouter = typeof optionRouter;
