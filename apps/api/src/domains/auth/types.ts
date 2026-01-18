/**
 * Auth Domain Types
 *
 * Domain types for authentication operations.
 */

/**
 * Input for setting auth cookie
 */
export interface SetAuthCookieInput {
	merchantId: string;
	cookieDomain?: string;
	maxAge?: number;
}

/**
 * Default max age for auth cookie (30 days in seconds)
 */
export const DEFAULT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
