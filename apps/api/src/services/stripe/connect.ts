import type Stripe from "stripe";
import { stripeLogger } from "../../lib/logger";

export type CreateStripeAccountInput = {
	email: string;
	businessName: string;
};

export type CreateStripeAccountOutput = {
	accountId: string;
};

/**
 * Creates a Stripe V2 Connect account.
 * Configuration:
 * - Dashboard: "express" (simplified merchant onboarding)
 * - Country: Germany (de)
 * - Currency: EUR
 * - Responsibilities: Platform-liable (application collects fees/losses)
 */
export async function createStripeAccount(
	stripe: Stripe,
	input: CreateStripeAccountInput,
): Promise<CreateStripeAccountOutput> {
	stripeLogger.info(
		{ email: input.email, businessName: input.businessName },
		"Creating Connect account",
	);

	try {
		const account = await stripe.v2.core.accounts.create({
			contact_email: input.email,
			display_name: input.businessName,
			dashboard: "express",
			identity: {
				country: "de",
				entity_type: "individual",
			},
			configuration: {
				merchant: {
					capabilities: {
						card_payments: { requested: true },
					},
				},
				// Enable as customer for platform subscriptions
				customer: {
					capabilities: {
						automatic_indirect_tax: { requested: true },
					},
				},
			},
			defaults: {
				currency: "eur",
				locales: ["de-DE"],
				responsibilities: {
					fees_collector: "application",
					losses_collector: "application",
				},
			},
			include: [
				"configuration.merchant",
				"configuration.customer",
				"requirements",
			],
		});

		stripeLogger.info(
			{ accountId: account.id },
			"Connect account created successfully",
		);

		return { accountId: account.id };
	} catch (error) {
		stripeLogger.error(
			{
				email: input.email,
				businessName: input.businessName,
				error: error instanceof Error ? error.message : String(error),
				stripeError:
					error && typeof error === "object" && "type" in error
						? (error as { type?: string; code?: string; message?: string })
						: undefined,
			},
			"Failed to create Connect account",
		);
		throw error;
	}
}

/**
 * Deletes a Stripe Connect account.
 * Used as a compensating transaction when operations fail.
 */
export async function deleteStripeAccount(
	stripe: Stripe,
	accountId: string,
): Promise<void> {
	await stripe.accounts.del(accountId);
}

export type CreateAccountLinkInput = {
	accountId: string;
	refreshUrl: string;
	returnUrl: string;
};

export type CreateAccountLinkOutput = {
	url: string;
	expiresAt: number;
};

/**
 * Creates a Stripe V2 Account Link for merchant onboarding.
 */
export async function createAccountLink(
	stripe: Stripe,
	input: CreateAccountLinkInput,
): Promise<CreateAccountLinkOutput> {
	stripeLogger.info(
		{
			accountId: input.accountId,
			refreshUrl: input.refreshUrl,
			returnUrl: input.returnUrl,
		},
		"Creating account link",
	);

	try {
		const accountLink = await stripe.v2.core.accountLinks.create({
			account: input.accountId,
			use_case: {
				type: "account_onboarding",
				account_onboarding: {
					// Must match all configurations set on account creation (merchant + customer)
					configurations: ["merchant", "customer"],
					refresh_url: input.refreshUrl,
					return_url: input.returnUrl,
				},
			},
		});

		stripeLogger.info(
			{
				accountId: input.accountId,
				url: accountLink.url,
				expiresAt: accountLink.expires_at,
			},
			"Account link created successfully",
		);

		return {
			url: accountLink.url,
			expiresAt: new Date(accountLink.expires_at).getTime(),
		};
	} catch (error) {
		stripeLogger.error(
			{
				accountId: input.accountId,
				refreshUrl: input.refreshUrl,
				returnUrl: input.returnUrl,
				error: error instanceof Error ? error.message : String(error),
				stripeError:
					error && typeof error === "object" && "type" in error
						? (error as { type?: string; code?: string; message?: string })
						: undefined,
			},
			"Failed to create account link",
		);
		throw error;
	}
}
