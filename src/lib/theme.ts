/**
 * Theme detection for multi-app theming
 *
 * Supports:
 * - Hostname-based detection (production multi-domain)
 * - Path-based fallback (local development)
 *
 * Usage:
 * - menuvo.app → shop theme
 * - console.menuvo.app → console theme
 * - localhost:3000/shop/* → shop theme
 * - localhost:3000/* (default) → console theme
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestUrl } from "@tanstack/react-start/server";

export type AppTheme = "shop" | "console";

/**
 * Detects which theme to use based on hostname and pathname.
 * Priority: hostname-based (production) > path-based (dev fallback)
 */
export function detectTheme(hostname: string, pathname: string): AppTheme {
	// 1. Hostname-based detection (production multi-domain)
	// menuvo.app or *.menuvo.app (except console subdomain) → shop
	if (
		hostname === "menuvo.app" ||
		(hostname.endsWith(".menuvo.app") && !hostname.startsWith("console."))
	) {
		return "shop";
	}

	// console.menuvo.app → console
	if (hostname.startsWith("console.")) {
		return "console";
	}

	// 2. Path-based fallback (local development / staging)
	if (pathname.startsWith("/shop")) {
		return "shop";
	}

	// Default to console theme
	return "console";
}

/**
 * Server function to detect theme from request headers.
 * Called in route beforeLoad to determine which theme to apply.
 */
export const detectThemeFromRequest = createServerFn().handler(
	async (): Promise<AppTheme> => {
		try {
			const host = getRequestHeader("host") || "";
			const urlString = getRequestUrl();
			const url = new URL(urlString);
			const pathname = url.pathname;

			return detectTheme(host, pathname);
		} catch {
			return "console";
		}
	},
);
