import { eq } from "drizzle-orm";
import { db } from "@/db";
import { merchants } from "@/db/schema";
import { getMerchantIdFromCookie } from "./fake-auth.functions";

export type AuthContext = {
	merchantId: number;
	merchant: {
		id: number;
		name: string;
		supportedLanguages: string[];
	};
};

/**
 * Get the authenticated merchant context.
 *
 * Reads merchantId from cookie. Falls back to first merchant if no cookie.
 * MUST be called from within a server function context.
 *
 * @throws Error if no merchant found (unauthorized)
 */
export async function getAuthContext(): Promise<AuthContext> {
	const merchantIdFromCookie = await getMerchantIdFromCookie();

	let merchant: typeof merchants.$inferSelect | undefined;

	if (merchantIdFromCookie) {
		merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantIdFromCookie),
		});
	}

	// Fallback: get first merchant if cookie is invalid or no cookie
	if (!merchant) {
		merchant = await db.query.merchants.findFirst();
	}

	if (!merchant) {
		throw new Error("Unauthorized: No merchant found");
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
