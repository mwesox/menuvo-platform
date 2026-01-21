/**
 * Auth Schemas
 *
 * Zod schemas for authentication-related API inputs.
 */

import { z } from "zod";

/**
 * Dev login schema
 */
export const devLoginSchema = z.object({
	merchantId: z.string().uuid(),
});

export type DevLoginInput = z.infer<typeof devLoginSchema>;
