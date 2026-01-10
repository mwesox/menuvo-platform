/**
 * Onboarding Router
 *
 * Handles merchant onboarding procedures:
 * - Initial merchant + store creation
 * - Sets authentication cookie after successful creation
 *
 * This router handles the initial setup flow for new merchants.
 * All procedures are public (no authentication required).
 */

import { merchants, stores } from "@menuvo/db/schema";
import slugify from "@sindresorhus/slugify";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure, router } from "../trpc.js";

export const onboardingRouter = router({
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

				// Generate unique slug
				const baseSlug = slugify(input.store.name);
				let slug = baseSlug;
				let counter = 1;

				// Check for existing slugs and increment if needed
				while (true) {
					const existing = await tx.query.stores.findFirst({
						where: eq(stores.slug, slug),
						columns: { id: true },
					});
					if (!existing) break;
					slug = `${baseSlug}-${counter}`;
					counter++;
				}

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
			console.log("[onboarding] Setting auth cookie:", {
				merchantId: result.merchant.id,
				cookieDomain: cookieDomain || "(not set - same-origin mode)",
				cookie: cookieValue,
			});
			ctx.resHeaders.set("Set-Cookie", cookieValue);

			return result;
		}),
});
