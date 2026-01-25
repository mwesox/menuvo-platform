/**
 * Payments Domain
 *
 * Payment service and PayPal adapter for payment operations.
 */

export type { IPaymentService } from "./interface.js";
// Service
export { PaymentService } from "./payment.service.js";
// PayPal adapter (for routes and other direct usage)
export {
	captureOrder,
	createOrder,
	createPartnerReferral,
	generateAuthAssertion,
	getAccessToken,
	getMerchantStatus,
	getOrderStatus,
	getServerUrl,
	isSandbox,
	PAYPAL_CONFIG,
	verifyWebhookSignature,
} from "./paypal.js";
// Router
export { paymentRouter } from "./router.js";
// Types
export type * from "./types.js";
