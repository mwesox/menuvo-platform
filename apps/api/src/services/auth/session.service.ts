/**
 * Session Extraction Service
 *
 * Abstracts session extraction from requests behind a clean interface.
 * Current implementation uses cookie-based authentication (simple dev-friendly approach).
 * This abstraction allows easy migration to JWT/session tokens in the future.
 */

import type { Session } from "@menuvo/trpc";

/**
 * Cookie name for merchant authentication
 * Matches the existing system's cookie name
 */
const MERCHANT_ID_COOKIE = "menuvo_merchant_id";

/**
 * UUID validation regex
 */
const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Parse cookies from cookie header string
 * @param cookieHeader - The value of the Cookie header
 * @returns Map of cookie names to values
 */
function parseCookies(cookieHeader: string | null): Map<string, string> {
	const cookies = new Map<string, string>();

	if (!cookieHeader) {
		return cookies;
	}

	// Split by semicolon and space, then by equals sign
	for (const cookie of cookieHeader.split("; ")) {
		const [name, ...valueParts] = cookie.split("=");
		if (name && valueParts.length > 0) {
			// Rejoin value in case it contains '=' (though unlikely for our use case)
			cookies.set(name, valueParts.join("="));
		}
	}

	return cookies;
}

/**
 * Extract merchant ID from cookie
 * @param cookieHeader - The value of the Cookie header
 * @returns Merchant ID if valid, undefined otherwise
 */
function extractMerchantIdFromCookie(
	cookieHeader: string | null,
): string | undefined {
	const cookies = parseCookies(cookieHeader);
	const merchantId = cookies.get(MERCHANT_ID_COOKIE);

	if (!merchantId) {
		return undefined;
	}

	// Validate UUID format
	if (!UUID_REGEX.test(merchantId)) {
		return undefined;
	}

	return merchantId;
}

/**
 * Extract session from request
 *
 * Current implementation: Cookie-based authentication
 * - Reads `menuvo_merchant_id` cookie
 * - Validates UUID format
 * - Creates Session with merchant as owner
 *
 * Future: Can be replaced with JWT/token-based extraction
 * without changing the calling code.
 *
 * @param req - The incoming request
 * @returns Session if authenticated, undefined otherwise
 */
export async function extractSession(
	req: Request,
): Promise<Session | undefined> {
	try {
		const cookieHeader = req.headers.get("cookie");
		const merchantId = extractMerchantIdFromCookie(cookieHeader);

		if (!merchantId) {
			return undefined;
		}

		// Create session object
		// In the current simple auth system, merchant acts as user
		// When upgrading to proper auth, this will come from token claims
		return {
			userId: merchantId, // Merchant ID serves as user ID in current system
			merchantId,
			storeId: undefined, // Optional, can be set later if needed
			role: "owner", // Merchant login implies owner role
		};
	} catch {
		// Fail gracefully - return undefined for any error
		// This ensures unauthenticated requests don't crash
		return undefined;
	}
}
