/**
 * Onboarding Service
 *
 * Orchestrates the onboarding workflow for new merchants.
 * Creates merchant and first store atomically in a transaction.
 */

import type { Database } from "@menuvo/db";
import { ConflictError } from "../errors.js";
import type { IMerchantsService } from "../merchants/index.js";
import type { IStoreService } from "../stores/index.js";
import { findUniqueSlug, generateSlug } from "../stores/utils.js";
import type { IOnboardingService } from "./interface.js";
import type { OnboardInput, OnboardResult } from "./types.js";

/**
 * Onboarding service implementation
 */
export class OnboardingService implements IOnboardingService {
	constructor(
		private readonly db: Database,
		private readonly merchantsService: IMerchantsService,
		private readonly storesService: IStoreService,
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

		// Atomic transaction - use injected services
		return await this.db.transaction(async (tx) => {
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
					// Use merchant contact info for the first store
					phone: input.merchant.phone ?? "",
					email: input.merchant.email,
				},
				tx,
			);

			return { merchant, store };
		});
	}
}
