import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";

/**
 * Get the current merchant, or null if none exists.
 * TODO: When auth implemented, derive from session
 */
export const getMerchantOrNull = createServerFn().handler(async () => {
	const merchant = await db.query.merchants.findFirst();
	return merchant ?? null;
});

/**
 * Get the current merchant. Throws if none exists.
 * Use getMerchantOrNull if you need to handle the no-merchant case.
 */
export const getMerchant = createServerFn().handler(async () => {
	const merchant = await db.query.merchants.findFirst();
	if (!merchant) throw new Error("No merchant found");
	return merchant;
});
