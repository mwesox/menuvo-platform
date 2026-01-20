/**
 * Store Settings Schemas
 *
 * Zod schemas for store settings procedures.
 */

import { z } from "zod";

/**
 * Single order type configuration schema
 */
export const orderTypeConfigSchema = z.object({
	enabled: z.boolean(),
	displayOrder: z.number().int().min(0),
});

/**
 * Full order types configuration schema
 * Validates that at least one order type is enabled
 */
export const orderTypesConfigSchema = z
	.object({
		dine_in: orderTypeConfigSchema,
		takeaway: orderTypeConfigSchema,
		delivery: orderTypeConfigSchema,
	})
	.refine(
		(config) =>
			config.dine_in.enabled ||
			config.takeaway.enabled ||
			config.delivery.enabled,
		"At least one order type must be enabled",
	);

export type OrderTypesConfigInput = z.infer<typeof orderTypesConfigSchema>;

/**
 * Get store settings - API schema
 */
export const getStoreSettingsSchema = z.object({
	storeId: z.string().uuid(),
});

export type GetStoreSettingsInput = z.infer<typeof getStoreSettingsSchema>;

/**
 * Get enabled order types by slug (public) - API schema
 */
export const getOrderTypesBySlugSchema = z.object({
	slug: z.string().min(1),
});

export type GetOrderTypesBySlugInput = z.infer<
	typeof getOrderTypesBySlugSchema
>;

/**
 * Save order types configuration - API schema
 */
export const saveOrderTypesSchema = z.object({
	storeId: z.string().uuid(),
	orderTypes: orderTypesConfigSchema,
});

export type SaveOrderTypesInput = z.infer<typeof saveOrderTypesSchema>;
