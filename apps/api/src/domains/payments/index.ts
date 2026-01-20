/**
 * Payments Domain
 *
 * Payment service and Mollie adapter for payment operations.
 */

export type { IPaymentService } from "./interface.js";
// Mollie adapter (for routes and other direct usage)
export {
	createClientLink,
	createMollieClientWithToken,
	enableDefaultPaymentMethods,
	exchangeCodeForTokens,
	getOnboardingStatus,
	getServerUrl,
	storeMerchantTokens,
} from "./mollie.js";
// Service
export { PaymentService } from "./payment.service.js";
// Router
export { paymentRouter } from "./router.js";
// Types
export type * from "./types.js";
