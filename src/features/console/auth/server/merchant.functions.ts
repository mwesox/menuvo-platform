import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";

/**
 * Get the current merchant.
 * TODO: When auth implemented, derive from session
 */
export const getMerchant = createServerFn().handler(async () => {
	const merchant = await db.query.merchants.findFirst();
	if (!merchant) throw new Error("No merchant found");
	return merchant;
});
