/**
 * Payment Service
 *
 * Domain service for payment operations.
 * Uses PayPal Marketplace Solutions as the payment provider.
 */

import type { Database } from "@menuvo/db";
import { merchants, orders } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { config } from "../../config.js";
import { env } from "../../env.js";
import type { IPaymentService } from "./interface.js";
import {
	captureOrder as capturePayPalOrder,
	createPartnerReferral,
	createOrder as createPayPalOrder,
	getMerchantStatus,
	getOrderStatus,
	PAYPAL_CONFIG,
} from "./paypal.js";
import type {
	CaptureResult,
	CreatePaymentInput,
	OnboardingResult,
	OnboardingStatus,
	PaymentAccountStatus,
	PaymentResult,
	PaymentStatus,
} from "./types.js";

/**
 * Payment service implementation using PayPal Marketplace.
 */
export class PaymentService implements IPaymentService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
		// Get order with merchant info (security: merchantId inferred from orderId)
		const order = await this.db.query.orders.findFirst({
			where: eq(orders.id, input.orderId),
			columns: { merchantId: true, totalAmount: true },
			with: {
				store: {
					columns: { id: true, currency: true },
					with: {
						merchant: {
							columns: {
								id: true,
								paypalMerchantId: true,
								paypalPaymentsReceivable: true,
							},
						},
					},
				},
			},
		});

		if (!order) {
			throw new Error("Order not found");
		}

		const merchant = order.store.merchant;
		if (!merchant) {
			throw new Error("Merchant not found for order");
		}

		if (!merchant.paypalMerchantId) {
			throw new Error(
				"PayPal account not connected. Please complete PayPal onboarding in settings.",
			);
		}

		if (!merchant.paypalPaymentsReceivable) {
			throw new Error(
				"PayPal account cannot receive payments yet. Please complete verification.",
			);
		}

		// Calculate platform fee (5% default)
		const platformFeeAmount = Math.round(
			order.totalAmount * config.platformFeePercent,
		);

		// Create PayPal order
		const result = await createPayPalOrder({
			orderId: input.orderId,
			amount: {
				value: input.amount.value,
				currency_code: input.amount.currency.toUpperCase(),
			},
			description: input.description,
			returnUrl: input.returnUrl,
			cancelUrl: input.cancelUrl,
			sellerMerchantId: merchant.paypalMerchantId,
			platformFee: {
				value: (platformFeeAmount / 100).toFixed(2),
				currency_code: input.amount.currency.toUpperCase(),
			},
		});

		return {
			paymentId: result.paypalOrderId,
			approvalUrl: result.approvalUrl,
			status: result.status,
		};
	}

	async capturePayment(orderId: string): Promise<CaptureResult> {
		// Get order with merchant info
		const order = await this.db.query.orders.findFirst({
			where: eq(orders.id, orderId),
			columns: { paypalOrderId: true, merchantId: true },
			with: {
				store: {
					with: {
						merchant: {
							columns: { paypalMerchantId: true },
						},
					},
				},
			},
		});

		if (!order) {
			throw new Error("Order not found");
		}

		if (!order.paypalOrderId) {
			throw new Error("PayPal order ID not found");
		}

		const sellerMerchantId = order.store.merchant?.paypalMerchantId;
		if (!sellerMerchantId) {
			throw new Error("Merchant PayPal ID not found");
		}

		// Capture the PayPal order
		const captureResult = await capturePayPalOrder(
			order.paypalOrderId,
			sellerMerchantId,
		);

		return {
			captureId: captureResult.captureId,
			status: captureResult.status,
		};
	}

	async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
		// Get order with PayPal order ID
		const order = await this.db.query.orders.findFirst({
			where: eq(orders.id, orderId),
			columns: { paypalOrderId: true },
			with: {
				store: {
					with: {
						merchant: {
							columns: { paypalMerchantId: true },
						},
					},
				},
			},
		});

		if (!order) {
			throw new Error("Order not found");
		}

		if (!order.paypalOrderId) {
			// No PayPal order created yet
			return {
				status: "NOT_CREATED",
				isPaid: false,
				isApproved: false,
				isFailed: false,
			};
		}

		const sellerMerchantId = order.store.merchant?.paypalMerchantId;

		// Get status from PayPal
		const status = await getOrderStatus(
			order.paypalOrderId,
			sellerMerchantId ?? undefined,
		);

		return {
			status: status.status,
			isPaid: status.isPaid || status.isCaptured,
			isApproved: status.isApproved,
			isFailed:
				status.status === "VOIDED" ||
				status.status === "DECLINED" ||
				status.status === "EXPIRED",
			captureId: status.captureId,
		};
	}

	async startOnboarding(merchantId: string): Promise<OnboardingResult> {
		const merchant = await this.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				id: true,
				name: true,
				email: true,
				paypalMerchantId: true,
			},
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		if (merchant.paypalMerchantId) {
			throw new Error("Merchant already has a PayPal account connected");
		}

		// Build return URL for after PayPal onboarding
		const returnUrl = `${env.SERVER_URL}${PAYPAL_CONFIG.RETURN_PATH}`;

		// Create partner referral
		const { onboardingUrl, trackingId } = await createPartnerReferral({
			merchantId: merchant.id,
			email: merchant.email,
			businessName: merchant.name,
			returnUrl,
		});

		// Update merchant with tracking ID and pending status
		await this.db
			.update(merchants)
			.set({
				paypalTrackingId: trackingId,
				paypalOnboardingStatus: "pending",
			})
			.where(eq(merchants.id, merchantId));

		return { onboardingUrl, trackingId };
	}

	async getOnboardingStatus(merchantId: string): Promise<OnboardingStatus> {
		const merchant = await this.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				paypalMerchantId: true,
				paypalTrackingId: true,
			},
		});

		if (!merchant?.paypalMerchantId) {
			return {
				connected: false,
				merchantId: null,
				paymentsReceivable: false,
				primaryEmailConfirmed: false,
				onboardingStatus: "not_connected",
			};
		}

		// Get fresh status from PayPal
		const status = await getMerchantStatus(
			merchant.paypalMerchantId,
			merchant.paypalTrackingId ?? undefined,
		);

		// Update DB with fresh status
		await this.db
			.update(merchants)
			.set({
				paypalOnboardingStatus: status.onboardingStatus,
				paypalPaymentsReceivable: status.paymentsReceivable,
				paypalPrimaryEmailConfirmed: status.primaryEmailConfirmed,
			})
			.where(eq(merchants.id, merchantId));

		return {
			connected: true,
			merchantId: status.merchantId,
			paymentsReceivable: status.paymentsReceivable,
			primaryEmailConfirmed: status.primaryEmailConfirmed,
			onboardingStatus: status.onboardingStatus,
		};
	}

	async getAccountStatus(merchantId: string): Promise<PaymentAccountStatus> {
		const merchant = await this.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				id: true,
				paypalMerchantId: true,
				paypalTrackingId: true,
				paypalOnboardingStatus: true,
				paypalPaymentsReceivable: true,
			},
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		return {
			connected: !!merchant.paypalMerchantId,
			merchantId: merchant.paypalMerchantId,
			trackingId: merchant.paypalTrackingId,
			onboardingStatus: merchant.paypalOnboardingStatus,
			canReceivePayments: merchant.paypalPaymentsReceivable ?? false,
		};
	}
}
