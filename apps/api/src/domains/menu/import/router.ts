/**
 * Menu Import Router
 *
 * Handles menu import procedures:
 * - Upload menu file (FormData)
 * - Get import job status
 * - Apply selected import changes
 *
 * Import jobs are created by the upload mutation and processed in the background.
 * This router handles the review and application of extracted data.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, storeOwnerProcedure } from "../../../trpc/trpc.js";
import {
	applyImportChangesSchema,
	getImportJobStatusSchema,
} from "./schemas.js";

export const importRouter = router({
	/**
	 * Upload a menu file for import (store owner only)
	 * Creates an import job and triggers background processing
	 */
	upload: storeOwnerProcedure
		.input(z.instanceof(FormData))
		.mutation(async ({ ctx, input }) => {
			const file = input.get("file") as File | null;
			const storeId = input.get("storeId") as string | null;

			// Basic validation
			if (!file) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Missing file" });
			}

			if (!storeId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Missing storeId",
				});
			}

			try {
				return await ctx.services.menuImport.uploadFile(
					ctx.session.merchantId,
					{
						file,
						storeId,
					},
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Store not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("Unsupported file type")) {
						throw new TRPCError({
							code: "BAD_REQUEST",
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
	 * Get import job status (store owner only)
	 * Returns the current status and extracted data for review
	 */
	getJobStatus: storeOwnerProcedure
		.input(getImportJobStatusSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.menuImport.getJobStatus(
					ctx.session.merchantId,
					input,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Import job not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("permission")) {
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
	 * Apply selected import changes (store owner only)
	 * Creates/updates categories, items, and option groups based on user selections
	 */
	applyChanges: storeOwnerProcedure
		.input(applyImportChangesSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.menuImport.applyChanges(
					ctx.session.merchantId,
					input,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (
						error.message === "Store not found" ||
						error.message === "Import job not found"
					) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (
						error.message.includes("not ready") ||
						error.message.includes("Unsupported")
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
});

export type ImportRouter = typeof importRouter;
