/**
 * Onboarding Service
 *
 * Orchestrates the onboarding workflow for new merchants.
 * Creates merchant and first store atomically in a transaction.
 */

import type { Database } from "@menuvo/db";
import { sendEmail } from "../../infrastructure/email/service.js";
import { emailLogger } from "../../lib/logger.js";
import { ConflictError } from "../errors.js";
import { deriveCountryCode, type IVatService } from "../menu/vat/index.js";
import type { IMerchantsService } from "../merchants/index.js";
import type { IStoreService } from "../stores/index.js";
import { findUniqueSlug, generateSlug } from "../stores/utils.js";
import type { IOnboardingService } from "./interface.js";
import { getWelcomeTemplate } from "./templates/index.js";
import type { OnboardInput, OnboardResult } from "./types.js";

/**
 * Onboarding service implementation
 */
export class OnboardingService implements IOnboardingService {
	constructor(
		private readonly db: Database,
		private readonly merchantsService: IMerchantsService,
		private readonly storesService: IStoreService,
		private readonly vatService: IVatService,
	) {}

	async onboard(input: OnboardInput): Promise<OnboardResult> {
		// Pre-flight checks BEFORE transaction (on main db)
		if (await this.merchantsService.isEmailRegistered(input.merchant.email)) {
			throw new ConflictError("A merchant with this email already exists");
		}

		// Generate slug before transaction
		const baseSlug = generateSlug(input.store.name);
		const slug = await findUniqueSlug(this.db, baseSlug);

		// Calculate trial (30 days)
		const trialEndsAt = new Date();
		trialEndsAt.setDate(trialEndsAt.getDate() + 30);

		// Derive country code from input or from country name
		const countryCode =
			input.store.countryCode ?? deriveCountryCode(input.store.country) ?? "DE";

		// Atomic transaction - use injected services
		const result = await this.db.transaction(async (tx) => {
			const merchant = await this.merchantsService.create(
				{
					...input.merchant,
					supportedLanguages: ["de"],
					subscriptionStatus: "trialing",
					subscriptionTrialEndsAt: trialEndsAt,
				},
				tx,
			);

			const store = await this.storesService.create(
				merchant.id,
				{
					...input.store,
					slug,
					countryCode,
					// Use merchant contact info for the first store
					phone: input.merchant.phone ?? "",
					email: input.merchant.email,
				},
				tx,
			);

			return { merchant, store };
		});

		// Create default VAT groups for the merchant (best effort, outside transaction)
		// Fails silently if country is not in templates - merchant can add manually
		this.vatService
			.createDefaultVatGroups(result.merchant.id, countryCode)
			.catch((err) => {
				emailLogger.warn(
					{ err, merchantId: result.merchant.id, countryCode },
					"Failed to create default VAT groups during onboarding",
				);
			});

		// Send welcome email (fire-and-forget)
		this.sendWelcomeEmail({
			to: result.merchant.email,
			ownerName: result.merchant.ownerName,
			storeName: result.store.name,
			trialEndsAt,
		});

		return result;
	}

	private sendWelcomeEmail(params: {
		to: string;
		ownerName: string;
		storeName: string;
		trialEndsAt: Date;
	}): void {
		const { subject, html } = getWelcomeTemplate({
			ownerName: params.ownerName,
			storeName: params.storeName,
			trialEndsAt: params.trialEndsAt,
			dashboardUrl: "https://console.menuvo.app",
			locale: "de",
		});

		sendEmail({
			to: params.to,
			subject,
			htmlBody: html,
		}).catch((err) => {
			emailLogger.error(
				{ err, to: params.to },
				"Failed to send welcome email after onboarding",
			);
		});
	}
}
