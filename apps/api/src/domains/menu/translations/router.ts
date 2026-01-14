/**
 * Translation Router
 *
 * Handles translation procedures:
 * - Translation status queries
 * - Entity translation updates (single language per update)
 * - Missing translation reports
 */

import { TRPCError } from "@trpc/server";
import {
	protectedProcedure,
	router,
	storeOwnerProcedure,
} from "../../../trpc/trpc.js";
import {
	getMissingTranslationsSchema,
	getTranslationStatusSchema,
	updateCategoryTranslationsSchema,
	updateItemTranslationsSchema,
	updateOptionChoiceTranslationsSchema,
	updateOptionGroupTranslationsSchema,
} from "./schemas.js";
import { TranslationsService } from "./service.js";

export const translationRouter = router({
	/**
	 * Get translation status for all entities in a store
	 */
	getStatus: protectedProcedure
		.input(getTranslationStatusSchema)
		.query(async ({ ctx, input }) => {
			const service = new TranslationsService(ctx.db);
			try {
				return await service.getStatus(input.storeId, ctx.session.merchantId);
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
	 * Get missing translations report
	 */
	getMissingReport: protectedProcedure
		.input(getMissingTranslationsSchema)
		.query(async ({ ctx, input }) => {
			const service = new TranslationsService(ctx.db);
			try {
				return await service.getMissingReport(
					input.storeId,
					ctx.session.merchantId,
					input.languageCode,
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
	 * Update category translations for a single language
	 */
	updateCategory: storeOwnerProcedure
		.input(updateCategoryTranslationsSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new TranslationsService(ctx.db);
			try {
				return await service.updateCategory(
					input.categoryId,
					ctx.session.merchantId,
					input.languageCode,
					input.name,
					input.description,
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
					if (error.message.includes("Failed to update")) {
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
	 * Update item translations for a single language
	 */
	updateItem: storeOwnerProcedure
		.input(updateItemTranslationsSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new TranslationsService(ctx.db);
			try {
				return await service.updateItem(
					input.itemId,
					ctx.session.merchantId,
					input.languageCode,
					input.name,
					input.description,
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
					if (error.message.includes("Failed to update")) {
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
	 * Update option group translations for a single language
	 */
	updateOptionGroup: storeOwnerProcedure
		.input(updateOptionGroupTranslationsSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new TranslationsService(ctx.db);
			try {
				return await service.updateOptionGroup(
					input.optionGroupId,
					ctx.session.merchantId,
					input.languageCode,
					input.name,
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
					if (error.message.includes("Failed to update")) {
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
	 * Update option choice translations for a single language
	 */
	updateOptionChoice: storeOwnerProcedure
		.input(updateOptionChoiceTranslationsSchema)
		.mutation(async ({ ctx, input }) => {
			const service = new TranslationsService(ctx.db);
			try {
				return await service.updateOptionChoice(
					input.optionChoiceId,
					ctx.session.merchantId,
					input.languageCode,
					input.name,
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
					if (error.message.includes("Failed to update")) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),
});

export type TranslationRouter = typeof translationRouter;
