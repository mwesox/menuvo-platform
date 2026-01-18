/**
 * Payment Service
 *
 * Domain service for payment operations.
 * Uses Mollie as the payment provider.
 */

import type { Database } from "@menuvo/db";
import { merchants } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import type { IPaymentService } from "./interface.js";
import {
	createClientLink,
	createPayment as createMolliePayment,
	getOnboardingStatus as getMollieOnboardingStatus,
	getPayment,
} from "./mollie.js";
import type {
	CreatePaymentInput,
	MollieStatus,
	OnboardingResult,
	OnboardingStatus,
	PaymentResult,
	PaymentStatus,
} from "./types.js";

/**
 * Payment service implementation.
 */
export class PaymentService implements IPaymentService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
		// Create payment via Mollie adapter
		// merchantId is inferred internally from orderId (security: never from input)
		const result = await createMolliePayment({
			orderId: input.orderId,
			storeId: input.storeId,
			amount: input.amount,
			description: input.description,
			redirectUrl: input.redirectUrl,
		});

		return {
			paymentId: result.paymentId,
			checkoutUrl: result.checkoutUrl ?? "",
		};
	}

	async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
		// merchantId and paymentId are inferred internally from orderId (security: never from input)
		const payment = await getPayment(orderId);

		return {
			status: payment.status,
			isPaid: payment.status === "paid",
			isFailed:
				payment.status === "failed" ||
				payment.status === "canceled" ||
				payment.status === "expired",
			isExpired: payment.status === "expired",
		};
	}

	async startOnboarding(merchantId: string): Promise<OnboardingResult> {
		const merchant = await this.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				id: true,
				name: true,
				email: true,
				mollieOrganizationId: true,
			},
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		if (merchant.mollieOrganizationId) {
			throw new Error("Merchant already has a Mollie organization");
		}

		// Create state parameter with merchantId for callback verification
		const state = Buffer.from(JSON.stringify({ merchantId })).toString(
			"base64url",
		);

		const { onboardingUrl } = await createClientLink({
			name: merchant.name,
			email: merchant.email,
			state,
		});

		// Update merchant status
		await this.db
			.update(merchants)
			.set({ mollieOnboardingStatus: "needs-data" })
			.where(eq(merchants.id, merchantId));

		return { onboardingUrl };
	}

	async getOnboardingStatus(merchantId: string): Promise<OnboardingStatus> {
		const merchant = await this.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				mollieOrganizationId: true,
				mollieAccessToken: true,
				mollieOnboardingStatus: true,
				mollieCanReceivePayments: true,
				mollieCanReceiveSettlements: true,
			},
		});

		if (!merchant?.mollieOrganizationId) {
			return {
				connected: false,
				canReceivePayments: false,
				canReceiveSettlements: false,
				status: "not_connected",
			};
		}

		// If we have an access token, fetch fresh status from Mollie
		if (merchant.mollieAccessToken) {
			try {
				const status = await getMollieOnboardingStatus(
					merchant.mollieAccessToken,
				);

				// Update DB with fresh status
				await this.db
					.update(merchants)
					.set({
						mollieOnboardingStatus: status.canReceivePayments
							? "completed"
							: status.status === "in-review"
								? "in-review"
								: "needs-data",
						mollieCanReceivePayments: status.canReceivePayments,
						mollieCanReceiveSettlements: status.canReceiveSettlements,
					})
					.where(eq(merchants.id, merchantId));

				return {
					connected: true,
					canReceivePayments: status.canReceivePayments,
					canReceiveSettlements: status.canReceiveSettlements,
					status: status.canReceivePayments
						? "completed"
						: status.status === "in-review"
							? "in-review"
							: "needs-data",
					dashboardUrl: status.dashboardUrl,
				};
			} catch {
				// Fall back to DB values if API call fails
			}
		}

		// Return DB values
		return {
			connected: true,
			canReceivePayments: merchant.mollieCanReceivePayments ?? false,
			canReceiveSettlements: merchant.mollieCanReceiveSettlements ?? false,
			status: merchant.mollieOnboardingStatus ?? "needs-data",
		};
	}

	async getDashboardUrl(merchantId: string): Promise<string | undefined> {
		const merchant = await this.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: { mollieAccessToken: true },
		});

		if (!merchant?.mollieAccessToken) {
			return undefined;
		}

		const status = await getMollieOnboardingStatus(merchant.mollieAccessToken);
		return status.dashboardUrl;
	}

	async getMollieStatus(merchantId: string): Promise<MollieStatus> {
		const merchant = await this.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				id: true,
				mollieOrganizationId: true,
				mollieProfileId: true,
				mollieOnboardingStatus: true,
				mollieCanReceivePayments: true,
				mollieCanReceiveSettlements: true,
			},
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		return {
			connected: !!merchant.mollieOrganizationId,
			organizationId: merchant.mollieOrganizationId,
			profileId: merchant.mollieProfileId,
			onboardingStatus: merchant.mollieOnboardingStatus,
			canReceivePayments: merchant.mollieCanReceivePayments ?? false,
			canReceiveSettlements: merchant.mollieCanReceiveSettlements ?? false,
		};
	}
}
