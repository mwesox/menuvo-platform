"use client";

import {
	EmbeddedCheckout,
	EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useMemo } from "react";

interface EmbeddedCheckoutWrapperProps {
	clientSecret: string;
	merchantAccountId: string | null;
}

/**
 * Wrapper component for Stripe Embedded Checkout.
 * Handles Stripe Connect by passing the merchant's account ID to loadStripe.
 */
export function EmbeddedCheckoutWrapper({
	clientSecret,
	merchantAccountId,
}: EmbeddedCheckoutWrapperProps) {
	// Create stripe promise with connected account for Direct Charges
	// merchantAccountId is required for Connect - payments go to merchant's account
	const stripePromise = useMemo(() => {
		const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
		if (!publishableKey) {
			console.error("VITE_STRIPE_PUBLISHABLE_KEY is not configured");
			return null;
		}

		return loadStripe(
			publishableKey,
			merchantAccountId ? { stripeAccount: merchantAccountId } : undefined,
		) as Promise<Stripe | null>;
	}, [merchantAccountId]);

	if (!stripePromise) {
		return (
			<div className="p-4 text-center text-destructive">
				Payment system is not configured. Please contact support.
			</div>
		);
	}

	return (
		<EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
			<EmbeddedCheckout className="min-h-[400px]" />
		</EmbeddedCheckoutProvider>
	);
}
