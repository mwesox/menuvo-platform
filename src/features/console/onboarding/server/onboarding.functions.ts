import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { merchants, stores } from "@/db/schema.ts";
import { generateSlug } from "@/lib/slug";
import { onboardingSchema } from "../schemas.ts";

export const onboardMerchant = createServerFn({ method: "POST" })
	.inputValidator(onboardingSchema)
	.handler(async ({ data }) => {
		const result = await db.transaction(async (tx) => {
			// Calculate trial end date (30 days from now)
			const trialEndsAt = new Date();
			trialEndsAt.setDate(trialEndsAt.getDate() + 30);

			// Create merchant with trial subscription
			const [newMerchant] = await tx
				.insert(merchants)
				.values({
					name: data.merchant.name,
					ownerName: data.merchant.ownerName,
					email: data.merchant.email,
					phone: data.merchant.phone,
					// Default to German - can add more languages in settings later
					supportedLanguages: ["de"],
					// Start with 30-day trial
					subscriptionStatus: "trialing",
					subscriptionTrialEndsAt: trialEndsAt,
				})
				.returning();

			// Generate unique slug
			const baseSlug = generateSlug(data.store.name);
			let slug = baseSlug;
			let counter = 1;

			// Check for existing slugs and increment if needed
			while (true) {
				const existing = await tx.query.stores.findFirst({
					where: (stores, { eq }) => eq(stores.slug, slug),
				});
				if (!existing) break;
				slug = `${baseSlug}-${counter}`;
				counter++;
			}

			// Create first store
			const [newStore] = await tx
				.insert(stores)
				.values({
					merchantId: newMerchant.id,
					name: data.store.name,
					slug,
					street: data.store.street,
					city: data.store.city,
					postalCode: data.store.postalCode,
					country: data.store.country,
					timezone: data.store.timezone,
					currency: data.store.currency,
				})
				.returning();

			return {
				merchant: newMerchant,
				store: newStore,
			};
		});

		return result;
	});
