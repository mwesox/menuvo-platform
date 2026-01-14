/**
 * Service Points Domain Types
 */

import type { z } from "zod";
import type {
	batchCreateServicePointsSchema,
	createServicePointSchema,
	updateServicePointSchema,
} from "./schemas.js";

export type CreateServicePointInput = z.infer<typeof createServicePointSchema>;
export type UpdateServicePointApiInput = z.infer<
	typeof updateServicePointSchema
>;
export type BatchCreateServicePointsInput = z.infer<
	typeof batchCreateServicePointsSchema
>;

/**
 * UpdateServicePointInput for service layer (id is passed separately, so omitted here)
 */
export type UpdateServicePointInput = Omit<UpdateServicePointApiInput, "id">;
