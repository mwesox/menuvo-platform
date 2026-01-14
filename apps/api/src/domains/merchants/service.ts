/**
 * Merchants Service
 *
 * Service facade for merchant operations.
 */

import type { Database } from "@menuvo/db";
import { merchants } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { DomainError } from "../errors.js";
import type { IMerchantsService } from "./interface.js";
import type { UpdateLanguagesInput, UpdateMerchantInput } from "./types.js";

/**
 * Merchants service implementation
 */
export class MerchantsService implements IMerchantsService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getMerchant(merchantId: string) {
		const merchant = await this.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
		});

		if (!merchant) {
			throw new DomainError("NOT_FOUND", "Merchant not found");
		}

		return merchant;
	}

	async updateMerchant(merchantId: string, input: UpdateMerchantInput) {
		const [updatedMerchant] = await this.db
			.update(merchants)
			.set(input)
			.where(eq(merchants.id, merchantId))
			.returning();

		if (!updatedMerchant) {
			throw new DomainError("NOT_FOUND", "Merchant not found");
		}

		return updatedMerchant;
	}

	async updateLanguages(merchantId: string, input: UpdateLanguagesInput) {
		const [updatedMerchant] = await this.db
			.update(merchants)
			.set({ supportedLanguages: input.supportedLanguages })
			.where(eq(merchants.id, merchantId))
			.returning();

		if (!updatedMerchant) {
			throw new DomainError("NOT_FOUND", "Merchant not found");
		}

		return updatedMerchant;
	}
}
