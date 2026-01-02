import type Stripe from "stripe";
import { stripeLogger } from "@/lib/logger";

/**
 * Handle checkout.session.completed event for subscription checkouts.
 *
 * This webhook serves as confirmation/audit log.
 * The actual record creation may happen synchronously when user returns from Stripe.
 * This can be used to mark tasks as completed or trigger other async workflows.
 */
export async function handleCheckoutSessionCompleted(
	session: Stripe.Checkout.Session,
): Promise<void> {
	stripeLogger.info(
		{
			sessionId: session.id,
			paymentStatus: session.payment_status,
			mode: session.mode,
			metadata: session.metadata,
		},
		"Checkout session completed",
	);

	// TODO: Add custom handling based on metadata
	// Example: Mark onboarding tasks as completed
	// const taskId = session.metadata?.onboarding_task_id;
	// if (taskId) {
	//   await markOnboardingTaskComplete(taskId);
	// }

	stripeLogger.debug({ sessionId: session.id }, "Checkout session processed");
}

/**
 * Handle checkout.session.expired event.
 *
 * Triggered when a checkout session expires without payment.
 */
export async function handleCheckoutSessionExpired(
	session: Stripe.Checkout.Session,
): Promise<void> {
	stripeLogger.info({ sessionId: session.id }, "Checkout session expired");

	// TODO: Add custom handling
	// Example: Clean up pending orders, notify user, etc.
}
