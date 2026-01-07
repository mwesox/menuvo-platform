"use server";

import { createMiddleware } from "@tanstack/react-start";
import { type AuthContext, getAuthContext } from "./auth-context";

/**
 * Middleware that adds authentication context to server functions.
 *
 * Usage:
 * ```ts
 * export const myServerFn = createServerFn({ method: "POST" })
 *   .middleware([withAuth])
 *   .inputValidator(mySchema)
 *   .handler(async ({ context, data }) => {
 *     const { merchantId } = context.auth;
 *     // ...
 *   });
 * ```
 */
export const withAuth = createMiddleware().server(async ({ next }) => {
	const auth = await getAuthContext();
	return next({ context: { auth } });
});

export type { AuthContext };
