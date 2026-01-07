"use server";

/**
 * Fake auth system for development/testing.
 * Stores merchantId in a cookie - easy to replace with real session auth later.
 */
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { merchants } from "@/db/schema";

const MERCHANT_ID_COOKIE = "menuvo_merchant_id";

const loginAsMerchantSchema = z.object({ merchantId: z.string().uuid() });

/**
 * Parse merchantId from cookie header.
 * MUST be called within server function context.
 *
 * Note: This is an internal helper wrapped in createServerFn to ensure
 * server-only imports (getRequestHeader) don't leak into client bundles.
 */
export const getMerchantIdFromCookie = createServerFn({
	method: "GET",
}).handler(async (): Promise<string | null> => {
	// Dynamic import to avoid bundling server-only code in client
	const { getRequestHeader } = await import("@tanstack/react-start/server");

	try {
		const cookieHeader = getRequestHeader("cookie");
		if (!cookieHeader) return null;

		const cookies = Object.fromEntries(
			cookieHeader.split("; ").map((c) => {
				const [key, ...val] = c.split("=");
				return [key, val.join("=")];
			}),
		);

		const merchantIdStr = cookies[MERCHANT_ID_COOKIE];
		if (!merchantIdStr) return null;

		// Validate UUID format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(merchantIdStr) ? merchantIdStr : null;
	} catch {
		return null;
	}
});

/**
 * Get all merchants for the login picker.
 */
export const getAllMerchants = createServerFn().handler(async () => {
	const allMerchants = await db.query.merchants.findMany({
		columns: {
			id: true,
			name: true,
			email: true,
			ownerName: true,
			createdAt: true,
		},
		with: {
			stores: {
				columns: { id: true, name: true },
				limit: 1,
			},
		},
		orderBy: (merchants, { desc }) => [desc(merchants.createdAt)],
	});
	return allMerchants;
});

/**
 * Login as a specific merchant (set cookie).
 */
export const loginAsMerchant = createServerFn({ method: "POST" })
	.inputValidator(loginAsMerchantSchema)
	.handler(async ({ data }) => {
		// Dynamic import to avoid bundling server-only code in client
		const { setCookie } = await import("@tanstack/react-start/server");

		// Verify merchant exists
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, data.merchantId),
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		// Set cookie (30 days expiry)
		// Note: sameSite only set in production - Safari requires Secure flag with SameSite=lax
		// and localhost runs over HTTP, causing cookie not to be sent on subsequent requests
		const isProduction = process.env.NODE_ENV === "production";
		setCookie(MERCHANT_ID_COOKIE, String(data.merchantId), {
			httpOnly: true,
			secure: isProduction,
			...(isProduction && { sameSite: "lax" }),
			maxAge: 60 * 60 * 24 * 30, // 30 days
			path: "/",
		});

		return { success: true, merchantId: data.merchantId };
	});
