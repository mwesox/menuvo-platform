import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { merchants } from "@/db/schema";
import { getMerchantIdFromCookie } from "./fake-auth.functions";

/**
 * Get merchant by cookie. No fallbacks for security.
 * Internal helper. MUST be called from within a server function context.
 */
async function getMerchantFromAuth() {
	const merchantIdFromCookie = await getMerchantIdFromCookie();

	if (!merchantIdFromCookie) {
		return null;
	}

	return db.query.merchants.findFirst({
		where: eq(merchants.id, merchantIdFromCookie),
	});
}

/**
 * Get the current merchant, or null if not authenticated.
 * Used by route beforeLoad for bootstrap.
 */
export const getMerchantOrNull = createServerFn().handler(async () => {
	const merchant = await getMerchantFromAuth();
	return merchant ?? null;
});

/**
 * Get the current merchant. Throws if not authenticated.
 * Use getMerchantOrNull if you need to handle the no-merchant case.
 */
export const getMerchant = createServerFn().handler(async () => {
	const merchant = await getMerchantFromAuth();
	if (!merchant) throw new Error("Unauthorized: No merchant session");
	return merchant;
});
