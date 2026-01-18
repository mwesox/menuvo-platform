/**
 * Auth Domain
 *
 * Exports auth service, router, and types.
 */

export type { IAuthService } from "./interface.js";
export { authRouter } from "./router.js";
export type * from "./schemas.js";
export { AuthService } from "./service.js";
export type * from "./types.js";
export { DEFAULT_COOKIE_MAX_AGE } from "./types.js";
