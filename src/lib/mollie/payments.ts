import { Locale, type Payment } from "@mollie/api-client";
import { getMollieClient } from "./client";
import type { Amount } from "./types";

export type CreateOrderPaymentInput = {
	orderId: string;
	storeId: string;
	amount: Amount;
	description: string;
	redirectUrl: string;
	webhookUrl: string;
	profileId?: string;
	applicationFee?: { amount: Amount; description: string };
};

export type CreateOrderPaymentOutput = {
	paymentId: string;
	checkoutUrl: string | undefined;
};

/**
 * Create a Mollie payment for an order.
 *
 * @param input - Payment creation parameters
 * @returns The payment ID and checkout URL for redirect
 */
export async function createOrderPayment(
	input: CreateOrderPaymentInput,
): Promise<CreateOrderPaymentOutput> {
	const mollie = getMollieClient();

	const payment = await mollie.payments.create({
		amount: input.amount,
		description: input.description,
		redirectUrl: input.redirectUrl,
		webhookUrl: input.webhookUrl,
		locale: Locale.de_DE,
		metadata: {
			orderId: String(input.orderId),
			storeId: String(input.storeId),
		},
		profileId: input.profileId,
		applicationFee: input.applicationFee,
	});

	return {
		paymentId: payment.id,
		checkoutUrl: payment._links.checkout?.href,
	};
}

/**
 * Get a payment by its ID.
 *
 * @param paymentId - The Mollie payment ID (tr_xxx)
 * @returns The full payment object from Mollie
 */
export async function getPayment(paymentId: string): Promise<Payment> {
	const mollie = getMollieClient();
	return mollie.payments.get(paymentId);
}

/**
 * Cancel a payment.
 * Only works if the payment has not yet been completed.
 *
 * @param paymentId - The Mollie payment ID (tr_xxx)
 * @returns true if cancellation was successful
 * @throws Error if the payment cannot be canceled (e.g., already paid)
 */
export async function cancelPayment(paymentId: string): Promise<boolean> {
	const mollie = getMollieClient();
	await mollie.payments.cancel(paymentId);
	return true;
}
