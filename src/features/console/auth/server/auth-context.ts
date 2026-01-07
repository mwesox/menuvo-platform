"use server";

import { getMerchantIdFromCookie } from "./fake-auth.functions";

export type AuthContext = {
	merchantId: string;
	merchant: {
		id: string;
		name: string;
		supportedLanguages: string[];
	};
};

/**
 * Get the authenticated merchant context.
 *
 * Reads merchantId from cookie. No fallbacks for security.
 * MUST be called from within a server function context.
 *
 * @throws Error if not authenticated or merchant not found
 */
export async function getAuthContext(): Promise<AuthContext> {
	const merchantIdFromCookie = await getMerchantIdFromCookie();

	if (!merchantIdFromCookie) {
		throw new Error("Unauthorized: No merchant session");
	}

	// Dynamic import to prevent db from leaking to client bundle
	const [{ eq }, { db }, { merchants }] = await Promise.all([
		import("drizzle-orm"),
		import("@/db"),
		import("@/db/schema"),
	]);

	const merchant = await db.query.merchants.findFirst({
		where: eq(merchants.id, merchantIdFromCookie),
	});

	if (!merchant) {
		throw new Error("Unauthorized: Invalid merchant session");
	}

	return {
		merchantId: merchant.id,
		merchant: {
			id: merchant.id,
			name: merchant.name,
			supportedLanguages: merchant.supportedLanguages ?? ["de"],
		},
	};
}
