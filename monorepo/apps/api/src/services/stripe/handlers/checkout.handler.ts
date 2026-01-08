import type Stripe from "stripe";
// TODO: Implement updatePaymentStatus via tRPC procedure
// import { updatePaymentStatus } from "@/features/orders/server/orders.functions";
import { stripeLogger } from "../../../lib/logger";
import { registerV1Handler } from "./registry";

// ============================================
// Event Handlers (Self-Registering)
// ============================================

/**
 * Handle checkout.session.completed event for order payments.
 *
 * Updates the order status to "confirmed" and payment status to "paid".
 * Also stores the payment intent ID for reference.
 */
registerV1Handler("checkout.session.completed", async (event) => {
	const session = event.data.object as Stripe.Checkout.Session;

	stripeLogger.info(
		{
			sessionId: session.id,
			paymentStatus: session.payment_status,
			mode: session.mode,
			metadata: session.metadata,
		},
		"Checkout session completed",
	);

	// Update order payment status if this is an order payment
	const orderId = session.metadata?.orderId;
	if (orderId) {
		// TODO: Call updatePaymentStatus via tRPC
		// await updatePaymentStatus({
		// 	data: {
		// 		orderId,
		// 		paymentStatus: "paid",
		// 		stripePaymentIntentId:
		// 			typeof session.payment_intent === "string"
		// 				? session.payment_intent
		// 				: undefined,
		// 	},
		// });
		stripeLogger.info(
			{ orderId, sessionId: session.id },
			"Order payment confirmed",
		);
	}

	stripeLogger.debug({ sessionId: session.id }, "Checkout session processed");
});

/**
 * Handle checkout.session.expired event.
 *
 * Triggered when a checkout session expires without payment.
 * Updates the order status to "cancelled" and payment status to "expired".
 */
registerV1Handler("checkout.session.expired", async (event) => {
	const session = event.data.object as Stripe.Checkout.Session;

	stripeLogger.info({ sessionId: session.id }, "Checkout session expired");

	// Cancel the order if this is an order payment
	const orderId = session.metadata?.orderId;
	if (orderId) {
		// TODO: Call updatePaymentStatus via tRPC
		// await updatePaymentStatus({
		// 	data: {
		// 		orderId,
		// 		paymentStatus: "expired",
		// 	},
		// });
		stripeLogger.info(
			{ orderId, sessionId: session.id },
			"Order payment expired",
		);
	}
});
