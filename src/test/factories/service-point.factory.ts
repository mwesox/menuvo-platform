/**
 * Service Point test factory.
 */

import { servicePoints } from "@/db/schema";
import { testDb } from "../db";
import { uniqueId } from "../utils/test-id";

export interface ServicePointFactoryOptions {
	testRunId: string;
	storeId: number;
	name?: string;
	code?: string;
	zone?: string;
	description?: string;
	attributes?: Record<string, string | number | boolean>;
	displayOrder?: number;
	isActive?: boolean;
}

export async function createTestServicePoint(
	options: ServicePointFactoryOptions,
) {
	const id = uniqueId();
	const name = options.name ?? `Test Service Point ${id}`;
	const code = options.code ?? `test-sp-${options.testRunId}-${id}`;

	const [servicePoint] = await testDb
		.insert(servicePoints)
		.values({
			storeId: options.storeId,
			name,
			code,
			zone: options.zone ?? null,
			description: options.description ?? null,
			attributes: options.attributes ?? null,
			displayOrder: options.displayOrder ?? 0,
			isActive: options.isActive ?? true,
		})
		.returning();

	return servicePoint;
}
