/**
 * Merchants Service
 *
 * Service facade for merchant operations.
 */

import type { Database, Transaction } from "@menuvo/db";
import { merchants } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { ConflictError, DomainError, ValidationError } from "../errors.js";
import type { IMerchantsService } from "./interface.js";
import type {
	CreateMerchantInput,
	UpdateLanguagesInput,
	UpdateMerchantInput,
} from "./types.js";

/**
 * Merchants service implementation
 */
export class MerchantsService implements IMerchantsService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async isEmailRegistered(email: string): Promise<boolean> {
		const existing = await this.db.query.merchants.findFirst({
			where: eq(merchants.email, email),
			columns: { id: true },
		});
		return existing !== undefined;
	}

	async create(input: CreateMerchantInput, tx?: Transaction) {
		// When called with a transaction, email check should be done before transaction starts
		// Only check email uniqueness for standalone calls (no tx)
		if (!tx && (await this.isEmailRegistered(input.email))) {
			throw new ConflictError("A merchant with this email already exists");
		}

		const db = tx ?? this.db;

		const [merchant] = await db
			.insert(merchants)
			.values({
				name: input.name,
				ownerName: input.ownerName,
				email: input.email,
				phone: input.phone,
				supportedLanguages: input.supportedLanguages ?? ["de"],
				subscriptionStatus: input.subscriptionStatus ?? "none",
				subscriptionTrialEndsAt: input.subscriptionTrialEndsAt,
			})
			.returning();

		if (!merchant) {
			throw new ValidationError("Failed to create merchant");
		}

		return merchant;
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
