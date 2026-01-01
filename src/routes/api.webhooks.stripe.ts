import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";
import { env } from "@/env";
import {
	getStripeClient,
	// Checkout handlers
	handleCheckoutSessionCompleted,
	handleCheckoutSessionExpired,
	// Subscription handlers
	handleSubscriptionCreated,
	handleSubscriptionDeleted,
	handleSubscriptionPaused,
	handleSubscriptionResumed,
	handleSubscriptionUpdated,
	handleTrialWillEnd,
	ingestStripeEvent,
	markEventFailed,
	markEventProcessed,
} from "@/lib/stripe";

/**
 * Stripe Snapshot Events Webhook Handler
 *
 * Handles snapshot events (full payload) from Stripe V1 API resources:
 * - checkout.session.completed - Payment successful (including subscription onboarding)
 * - checkout.session.expired - Checkout session expired
 * - customer.subscription.* - Subscription lifecycle events
 *
 * ALL events are stored in the database without filtering.
 *
 * Setup:
 * 1. In Stripe Dashboard → Developers → Webhooks → Add endpoint
 * 2. Enter URL: https://your-domain.com/api/webhooks/stripe
 * 3. Select events to listen to
 *
 * Local testing with Stripe CLI:
 * stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
 */
export const Route = createFileRoute("/api/webhooks/stripe")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				// Validate environment
				if (!env.STRIPE_WEBHOOK_SECRET) {
					console.error("STRIPE_WEBHOOK_SECRET not configured");
					return Response.json(
						{ error: "Webhook not configured" },
						{ status: 500 },
					);
				}

				const stripe = getStripeClient();
				const signature = request.headers.get("stripe-signature");

				if (!signature) {
					console.warn("Missing stripe-signature header");
					return Response.json(
						{ error: "Missing stripe-signature header" },
						{ status: 400 },
					);
				}

				// Get raw body for signature verification
				const rawBody = await request.text();

				// Verify signature and construct event
				let event: Stripe.Event;
				try {
					event = stripe.webhooks.constructEvent(
						rawBody,
						signature,
						env.STRIPE_WEBHOOK_SECRET,
					);
				} catch (err) {
					console.error("Webhook signature verification failed:", err);
					return Response.json({ error: "Invalid signature" }, { status: 400 });
				}

				console.log(
					`Webhook received: ${event.type} (${event.id})`,
					event.account ? `account: ${event.account}` : "",
				);

				// Ingest event to database (idempotency check)
				// ALL events are stored without filtering
				const ingestResult = await ingestStripeEvent({
					eventId: event.id,
					eventType: event.type,
					apiVersion: event.api_version ?? null,
					stripeCreatedAt: new Date(event.created * 1000),
					stripeAccountId: event.account ?? null,
					payload: event as unknown as Record<string, unknown>,
				});

				// If event already processed, return early
				if (!ingestResult.isNew) {
					console.log(`Event already processed (duplicate): ${event.id}`);
					return Response.json({ received: true, duplicate: true });
				}

				try {
					// Handle event based on type
					// Events are processed but ALL are stored regardless of handler
					switch (event.type) {
						// Checkout events
						case "checkout.session.completed":
							await handleCheckoutSessionCompleted(
								event.data.object as Stripe.Checkout.Session,
							);
							break;

						case "checkout.session.expired":
							await handleCheckoutSessionExpired(
								event.data.object as Stripe.Checkout.Session,
							);
							break;

						// Subscription events
						case "customer.subscription.created":
							await handleSubscriptionCreated(
								event.data.object as Stripe.Subscription,
							);
							break;

						case "customer.subscription.updated":
							await handleSubscriptionUpdated(
								event.data.object as Stripe.Subscription,
							);
							break;

						case "customer.subscription.deleted":
							await handleSubscriptionDeleted(
								event.data.object as Stripe.Subscription,
							);
							break;

						case "customer.subscription.paused":
							await handleSubscriptionPaused(
								event.data.object as Stripe.Subscription,
							);
							break;

						case "customer.subscription.resumed":
							await handleSubscriptionResumed(
								event.data.object as Stripe.Subscription,
							);
							break;

						case "customer.subscription.trial_will_end":
							await handleTrialWillEnd(
								event.data.object as Stripe.Subscription,
							);
							break;

						default:
							// All events are stored, but we log unhandled ones
							console.log(`Unhandled event type: ${event.type}`);
					}

					// Mark event as processed
					await markEventProcessed(event.id);

					console.log(`Webhook processed: ${event.type} (${event.id})`);

					return Response.json({ received: true });
				} catch (err) {
					console.error(`Webhook processing failed: ${event.type}`, err);

					// Mark event as failed
					await markEventFailed(event.id);

					// Return 200 to prevent Stripe retries for processing errors
					// The event is stored and can be replayed manually
					return Response.json({
						received: true,
						error: err instanceof Error ? err.message : "Unknown error",
					});
				}
			},
		},
	},
});
