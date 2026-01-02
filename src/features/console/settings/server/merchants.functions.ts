import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { merchants } from "@/db/schema.ts";
import { merchantGeneralSchema, merchantLanguageSchema } from "../validation";

export const getMerchant = createServerFn({ method: "GET" })
	.inputValidator(z.object({ merchantId: z.number() }))
	.handler(async ({ data }) => {
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, data.merchantId),
		});
		if (!merchant) {
			throw new Error("Merchant not found");
		}
		return merchant;
	});

export const updateMerchantGeneral = createServerFn({ method: "POST" })
	.inputValidator(merchantGeneralSchema.extend({ merchantId: z.number() }))
	.handler(async ({ data }) => {
		const { merchantId, ...updates } = data;

		const [updatedMerchant] = await db
			.update(merchants)
			.set(updates)
			.where(eq(merchants.id, merchantId))
			.returning();

		if (!updatedMerchant) {
			throw new Error("Merchant not found");
		}

		return updatedMerchant;
	});

export const updateMerchantLanguages = createServerFn({ method: "POST" })
	.inputValidator(merchantLanguageSchema.extend({ merchantId: z.number() }))
	.handler(async ({ data }) => {
		const { merchantId, supportedLanguages } = data;

		const [updatedMerchant] = await db
			.update(merchants)
			.set({ supportedLanguages })
			.where(eq(merchants.id, merchantId))
			.returning();

		if (!updatedMerchant) {
			throw new Error("Merchant not found");
		}

		return updatedMerchant;
	});
