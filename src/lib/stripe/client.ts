import Stripe from "stripe";
import { env } from "@/env";

let stripeClient: Stripe | null = null;

/**
 * Get the Stripe client instance (singleton).
 * Uses T3 Env to access STRIPE_SECRET_KEY.
 */
export function getStripeClient(): Stripe {
	if (!stripeClient) {
		stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
	}
	return stripeClient;
}

export type StripeClient = Stripe;
