import { db } from "@/db";

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
 * Placeholder: Returns first merchant in database.
 * TODO: When auth implemented, read from session/cookie.
 *
 * @throws Error if no merchant found (unauthorized)
 */
export async function getAuthContext(): Promise<AuthContext> {
	const merchant = await db.query.merchants.findFirst();
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
