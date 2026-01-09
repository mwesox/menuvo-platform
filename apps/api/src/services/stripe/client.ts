import Stripe from "stripe";
import { env } from "../../env";

let stripeClient: Stripe | null = null;

/**
 * Get the Stripe client instance (singleton).
 * Uses T3 Env to access STRIPE_SECRET_KEY.
 * @deprecated Use Mollie instead
 */
export function getStripeClient(): Stripe {
	if (!env.STRIPE_SECRET_KEY) {
		throw new Error(
			"Stripe is not configured. Set STRIPE_SECRET_KEY environment variable or use Mollie payment provider instead.",
		);
	}
	if (!stripeClient) {
		stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
	}
	return stripeClient;
}

export type StripeClient = Stripe;
