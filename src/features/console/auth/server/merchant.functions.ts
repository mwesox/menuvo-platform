import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { merchants } from "@/db/schema";
import { getMerchantIdFromCookie } from "./fake-auth.functions";

/**
 * Get merchant by cookie, with fallback to first merchant.
 * Internal helper for consistent auth behavior.
 * MUST be called from within a server function context.
 */
async function getMerchantFromAuth() {
	const merchantIdFromCookie = await getMerchantIdFromCookie();

	if (merchantIdFromCookie) {
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantIdFromCookie),
		});
		if (merchant) return merchant;
	}

	// Fallback to first merchant
	return db.query.merchants.findFirst();
}

/**
 * Get the current merchant, or null if none exists.
 * Reads from cookie, falls back to first merchant.
 */
export const getMerchantOrNull = createServerFn().handler(async () => {
	const merchant = await getMerchantFromAuth();
	return merchant ?? null;
});

/**
 * Get the current merchant. Throws if none exists.
 * Use getMerchantOrNull if you need to handle the no-merchant case.
 */
export const getMerchant = createServerFn().handler(async () => {
	const merchant = await getMerchantFromAuth();
	if (!merchant) throw new Error("No merchant found");
	return merchant;
});

/**
 * Require merchant for protected console routes.
 * Redirects to onboarding if no merchant exists.
 */
export const requireMerchant = createServerFn().handler(async () => {
	const merchant = await getMerchantFromAuth();
	if (!merchant) {
		throw redirect({ to: "/onboarding" });
	}
	return { merchant, merchantId: merchant.id };
});
