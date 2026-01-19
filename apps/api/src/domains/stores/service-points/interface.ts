/**
 * Service Points Service Interface
 *
 * Defines the contract for service point operations.
 */

import type { servicePoints } from "@menuvo/db/schema";
import type {
	BatchCreateServicePointsInput,
	CreateServicePointInput,
	UpdateServicePointInput,
} from "./types.js";

export type GetByShortCodeResult =
	| { status: "not_found" }
	| { status: "store_inactive" }
	| { status: "service_point_inactive" }
	| { status: "active"; storeSlug: string; servicePointCode: string };

/**
 * Service points service interface
 */
export interface IServicePointsService {
	list(
		storeId: string,
		merchantId: string,
	): Promise<(typeof servicePoints.$inferSelect)[]>;

	getById(
		servicePointId: string,
		merchantId: string,
	): Promise<typeof servicePoints.$inferSelect>;

	getByCode(
		storeSlug: string,
		code: string,
	): Promise<typeof servicePoints.$inferSelect | null>;

	getByShortCode(shortCode: string): Promise<GetByShortCodeResult>;

	validateForStore(servicePointId: string, storeId: string): Promise<boolean>;

	getZones(storeId: string, merchantId: string): Promise<string[]>;

	create(
		input: CreateServicePointInput,
		merchantId: string,
	): Promise<typeof servicePoints.$inferSelect>;

	update(
		servicePointId: string,
		merchantId: string,
		input: UpdateServicePointInput,
	): Promise<typeof servicePoints.$inferSelect>;

	toggleActive(
		servicePointId: string,
		merchantId: string,
		isActive: boolean,
	): Promise<typeof servicePoints.$inferSelect>;

	toggleZoneActive(
		storeId: string,
		merchantId: string,
		zone: string,
		isActive: boolean,
	): Promise<{ count: number; isActive: boolean }>;

	delete(servicePointId: string, merchantId: string): Promise<void>;

	batchCreate(
		input: BatchCreateServicePointsInput,
		merchantId: string,
	): Promise<(typeof servicePoints.$inferSelect)[]>;
}
