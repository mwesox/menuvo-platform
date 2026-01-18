/**
 * Auth Service
 *
 * Service facade for authentication operations.
 */

import type { Database } from "@menuvo/db";
import { merchants } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { DomainError } from "../errors.js";
import type { IAuthService } from "./interface.js";
import type { SetAuthCookieInput } from "./types.js";
import { DEFAULT_COOKIE_MAX_AGE } from "./types.js";

/**
 * Cookie name for merchant authentication
 */
const COOKIE_NAME = "menuvo_merchant_id";

/**
 * Auth service implementation
 */
export class AuthService implements IAuthService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getMerchant(merchantId: string) {
		const merchant = await this.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
		});

		if (!merchant) {
			throw new DomainError("NOT_FOUND", "Merchant not found");
		}

		return merchant;
	}

	async getMerchantOrNull(merchantId: string | undefined) {
		if (!merchantId) {
			return null;
		}

		try {
			const merchant = await this.db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
			});

			return merchant ?? null;
		} catch (error) {
			// Log error but don't throw - return null for graceful handling
			console.error("[auth.getMerchantOrNull] Error fetching merchant:", error);
			return null;
		}
	}

	createAuthCookie(input: SetAuthCookieInput): string {
		const { merchantId, cookieDomain, maxAge = DEFAULT_COOKIE_MAX_AGE } = input;

		const cookieParts = [
			`${COOKIE_NAME}=${merchantId}`,
			"Path=/",
			`Max-Age=${maxAge}`,
			"HttpOnly",
		];

		if (cookieDomain) {
			// Cross-origin mode: Secure + SameSite=None + Domain
			cookieParts.push("Secure");
			cookieParts.push("SameSite=None");
			cookieParts.push(`Domain=${cookieDomain}`);
		} else {
			// Same-origin mode: SameSite=Lax (more secure default)
			cookieParts.push("SameSite=Lax");
		}

		return cookieParts.join("; ");
	}

	createClearAuthCookie(cookieDomain?: string): string {
		const cookieParts = [`${COOKIE_NAME}=`, "Path=/", "Max-Age=0", "HttpOnly"];

		if (cookieDomain) {
			cookieParts.push("Secure");
			cookieParts.push("SameSite=None");
			cookieParts.push(`Domain=${cookieDomain}`);
		} else {
			cookieParts.push("SameSite=Lax");
		}

		return cookieParts.join("; ");
	}
}
