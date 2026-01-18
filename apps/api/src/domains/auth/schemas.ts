/**
 * Auth Schemas
 *
 * Zod schemas for authentication-related API inputs.
 */

import { z } from "zod";

/**
 * Dev login schema
 */
export const devLoginSchema = z.object({
	merchantId: z.string().uuid(),
});

export type DevLoginInput = z.infer<typeof devLoginSchema>;

/**
 * Onboarding schema - create new merchant and first store
 */
export const onboardInputSchema = z.object({
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
});

export type OnboardInput = z.infer<typeof onboardInputSchema>;
