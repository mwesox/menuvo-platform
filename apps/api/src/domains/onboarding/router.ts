/**
 * Onboarding Router
 *
 * Handles merchant signup/onboarding procedures:
 * - Create new merchant with first store
 */

import { TRPCError } from "@trpc/server";
import { mapDomainErrorToTRPC } from "../../trpc/error-mapper.js";
import { publicProcedure, router } from "../../trpc/trpc.js";
import { signupInputSchema } from "./schemas.js";

export const onboardingRouter = router({
	/**
	 * Sign up a new merchant and create their first store
	 * Public procedure - no authentication required
	 * Sets authentication cookie after successful creation
	 */
	signup: publicProcedure
		.input(signupInputSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				// Delegate to onboarding service
				const result = await ctx.services.onboarding.onboard(input);

				// Set authentication cookie via resHeaders (tRPC fetch adapter)
				if (!ctx.resHeaders) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message:
							"Cannot set authentication cookie - resHeaders not available",
					});
				}

				const cookieDomain = process.env.COOKIE_DOMAIN;
				const cookieValue = ctx.services.auth.createAuthCookie({
					merchantId: result.merchant.id,
					cookieDomain,
				});

				ctx.resHeaders.set("Set-Cookie", cookieValue);

				return result;
			} catch (error) {
				mapDomainErrorToTRPC(error);
			}
		}),
});

export type OnboardingRouter = typeof onboardingRouter;
