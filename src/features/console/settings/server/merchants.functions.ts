"use server";

import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { merchants } from "@/db/schema.ts";
import { withAuth } from "@/features/console/auth/server/auth-middleware";
import { merchantGeneralSchema, merchantLanguageSchema } from "../schemas";

export const getMerchant = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
		});
		if (!merchant) {
			throw new Error("Merchant not found");
		}
		return merchant;
	});

export const updateMerchantGeneral = createServerFn({ method: "POST" })
	.inputValidator(merchantGeneralSchema)
	.middleware([withAuth])
	.handler(async ({ context, data }) => {
		const { merchantId } = context.auth;

		const [updatedMerchant] = await db
			.update(merchants)
			.set(data)
			.where(eq(merchants.id, merchantId))
			.returning();

		if (!updatedMerchant) {
			throw new Error("Merchant not found");
		}

		return updatedMerchant;
	});

export const updateMerchantLanguages = createServerFn({ method: "POST" })
	.inputValidator(merchantLanguageSchema)
	.middleware([withAuth])
	.handler(async ({ context, data }) => {
		const { merchantId } = context.auth;
		const { supportedLanguages } = data;

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
