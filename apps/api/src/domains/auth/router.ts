/**
 * Auth Router
 *
 * Handles authentication-related procedures:
 * - Session management
 * - User profile
 * - Merchant access
 * - Merchant onboarding (initial merchant + store creation)
 */

import { merchants, stores } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	protectedProcedure,
	publicProcedure,
	router,
} from "../../trpc/trpc.js";
import { findUniqueSlug, generateSlug } from "../stores/index.js";
import { devLoginSchema } from "./schemas.js";

export const authRouter = router({
	/**
	 * Get current session information
	 * Returns null if not authenticated
	 */
	getSession: publicProcedure.query(({ ctx }) => {
		return ctx.session ?? null;
	}),

	/**
	 * Get current user profile
	 * Requires authentication
	 */
	me: protectedProcedure.query(({ ctx }) => {
		return {
			id: ctx.session.userId,
			merchantId: ctx.session.merchantId,
			role: ctx.session.role,
			storeId: ctx.session.storeId,
		};
	}),

	/**
	 * Get current merchant with full details
	 * Requires authentication, throws if merchant not found
	 */
	getMerchant: protectedProcedure.query(async ({ ctx }) => {
		try {
			return await ctx.services.auth.getMerchant(ctx.session.merchantId);
		} catch (error) {
			if (error instanceof Error && error.message === "Merchant not found") {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}
			throw error;
		}
	}),

	/**
	 * Get current merchant or null if not authenticated/not found
	 * Public procedure for conditional merchant access
	 * Gracefully handles database errors and returns null
	 */
	getMerchantOrNull: publicProcedure.query(async ({ ctx }) => {
		if (!ctx.session?.merchantId) {
			return null;
		}

		return await ctx.services.auth.getMerchantOrNull(ctx.session.merchantId);
	}),

	/**
	 * Logout current session
	 * Clears the authentication cookie
	 */
	logout: protectedProcedure.mutation(async ({ ctx }) => {
		if (!ctx.resHeaders) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Cannot clear cookie - resHeaders not available",
			});
		}

		const cookieDomain = process.env.COOKIE_DOMAIN;
		const cookieValue = ctx.services.auth.createClearAuthCookie(cookieDomain);
		ctx.resHeaders.set("Set-Cookie", cookieValue);

		return { success: true };
	}),

	/**
	 * Dev-only: List all merchants for dev login selector
	 * Returns merchants with their first store for display
	 */
	devListMerchants: publicProcedure.query(async ({ ctx }) => {
		return ctx.db.query.merchants.findMany({
			with: {
				stores: {
					limit: 1,
					columns: { name: true },
				},
			},
			columns: {
				id: true,
				name: true,
				ownerName: true,
				email: true,
			},
		});
	}),

	/**
	 * Dev-only: Log in as a specific merchant
	 * Sets the authentication cookie for the given merchant
	 */
	devLogin: publicProcedure
		.input(devLoginSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify merchant exists using domains service
			try {
				await ctx.services.auth.getMerchant(input.merchantId);
			} catch {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}

			// Set authentication cookie
			if (!ctx.resHeaders) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						"Cannot set authentication cookie - resHeaders not available",
				});
			}

			const cookieDomain = process.env.COOKIE_DOMAIN;
			const cookieValue = ctx.services.auth.createAuthCookie({
				merchantId: input.merchantId,
				cookieDomain,
			});

			ctx.resHeaders.set("Set-Cookie", cookieValue);

			return { success: true };
		}),

	/**
	 * Onboard a new merchant and create their first store
	 * Public procedure - no authentication required
	 * Sets authentication cookie after successful creation
	 */
	onboard: publicProcedure
		.input(
			z.object({
				merchant: z.object({
					name: z.string().min(4).max(100),
					ownerName: z.string().min(2).max(100),
					email: z.string().email(),
					phone: z.string().optional(),
				}),
				store: z.object({
					name: z.string().min(2).max(100),
					street: z.string().min(3).max(200),
					city: z.string().min(2).max(100),
					postalCode: z
						.string()
						.length(5)
						.regex(/^[0-9]{5}$/),
					country: z.string().min(2).max(100),
					timezone: z.string().default("Europe/Berlin"),
					currency: z.enum(["EUR", "USD", "GBP", "CHF"]).default("EUR"),
				}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if email already exists
			const existingMerchant = await ctx.db.query.merchants.findFirst({
				where: eq(merchants.email, input.merchant.email),
			});

			if (existingMerchant) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A merchant with this email already exists",
				});
			}

			// Calculate trial end date (30 days from now)
			const trialEndsAt = new Date();
			trialEndsAt.setDate(trialEndsAt.getDate() + 30);

			// Create merchant and store in a transaction
			const result = await ctx.db.transaction(async (tx) => {
				// Create merchant with trial subscription
				const [newMerchant] = await tx
					.insert(merchants)
					.values({
						name: input.merchant.name,
						ownerName: input.merchant.ownerName,
						email: input.merchant.email,
						phone: input.merchant.phone,
						// Default to German - can add more languages in settings later
						supportedLanguages: ["de"],
						// Start with 30-day trial
						subscriptionStatus: "trialing",
						subscriptionTrialEndsAt: trialEndsAt,
					})
					.returning();

				if (!newMerchant) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create merchant",
					});
				}

				// Generate unique slug using slug service
				// Use ctx.db (not tx) - slug lookup doesn't need transaction isolation
				// Unique constraint on slug column handles race conditions
				const baseSlug = generateSlug(input.store.name);
				const slug = await findUniqueSlug(ctx.db, baseSlug);

				// Create first store
				const [newStore] = await tx
					.insert(stores)
					.values({
						merchantId: newMerchant.id,
						name: input.store.name,
						slug,
						street: input.store.street,
						city: input.store.city,
						postalCode: input.store.postalCode,
						country: input.store.country,
						timezone: input.store.timezone,
						currency: input.store.currency,
					})
					.returning();

				if (!newStore) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create store",
					});
				}

				return {
					merchant: newMerchant,
					store: newStore,
				};
			});

			// Set authentication cookie via resHeaders (tRPC fetch adapter)
			if (!ctx.resHeaders) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						"Cannot set authentication cookie - resHeaders not available",
				});
			}

			// Cookie configuration via environment variable
			// If COOKIE_DOMAIN is set (production), use cross-origin cookies
			// If not set (local dev), use same-origin cookies
			const cookieDomain = process.env.COOKIE_DOMAIN;
			const maxAge = 60 * 60 * 24 * 30; // 30 days

			const cookieParts = [
				`menuvo_merchant_id=${result.merchant.id}`,
				"Path=/",
				`Max-Age=${maxAge}`,
				"HttpOnly",
			];

			if (cookieDomain) {
				// Production: cross-origin cookie for subdomain sharing
				// Required: SameSite=None + Secure for cross-origin cookies
				cookieParts.push("Secure");
				cookieParts.push("SameSite=None");
				cookieParts.push(`Domain=${cookieDomain}`);
			} else {
				// Local dev: same-origin cookies work with SameSite=Lax
				cookieParts.push("SameSite=Lax");
			}

			const cookieValue = cookieParts.join("; ");
			console.log("[auth.onboard] Setting auth cookie:", {
				merchantId: result.merchant.id,
				cookieDomain: cookieDomain || "(not set - same-origin mode)",
				cookie: cookieValue,
			});
			ctx.resHeaders.set("Set-Cookie", cookieValue);

			return result;
		}),
});

export type AuthRouter = typeof authRouter;
