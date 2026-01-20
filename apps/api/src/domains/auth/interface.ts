/**
 * Auth Service Interface
 *
 * Defines the contract for authentication operations.
 */

import type { merchants } from "@menuvo/db/schema";
import type { SetAuthCookieInput } from "./types.js";

/**
 * Auth service interface
 */
export interface IAuthService {
	getMerchant(merchantId: string): Promise<typeof merchants.$inferSelect>;

	getMerchantOrNull(
		merchantId: string | undefined,
	): Promise<typeof merchants.$inferSelect | null>;

	createAuthCookie(input: SetAuthCookieInput): string;

	createClearAuthCookie(cookieDomain?: string): string;
}
