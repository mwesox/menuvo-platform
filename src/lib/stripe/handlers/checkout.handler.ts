import type Stripe from "stripe";

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
	console.log(`[Webhook] Checkout session completed: ${session.id}`);
	console.log(`  Payment status: ${session.payment_status}`);
	console.log(`  Mode: ${session.mode}`);

	// Log metadata for debugging
	if (session.metadata && Object.keys(session.metadata).length > 0) {
		console.log(`  Metadata: ${JSON.stringify(session.metadata)}`);
	}

	// TODO: Add custom handling based on metadata
	// Example: Mark onboarding tasks as completed
	// const taskId = session.metadata?.onboarding_task_id;
	// if (taskId) {
	//   await markOnboardingTaskComplete(taskId);
	// }

	console.log(`[Webhook] Checkout session ${session.id} processed`);
}

/**
 * Handle checkout.session.expired event.
 *
 * Triggered when a checkout session expires without payment.
 */
export async function handleCheckoutSessionExpired(
	session: Stripe.Checkout.Session,
): Promise<void> {
	console.log(`[Webhook] Checkout session expired: ${session.id}`);

	// TODO: Add custom handling
	// Example: Clean up pending orders, notify user, etc.
}
