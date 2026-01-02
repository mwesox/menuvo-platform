/**
 * Test factory exports.
 */

// Re-export test db
export { closeTestDb, testDb } from "../db";
// Re-export cleanup
export { cleanupOldTestData, cleanupTestData } from "../utils/cleanup";
// Re-export test ID utilities
export {
	createTestRunId,
	resetCounter,
	uniqueEmail,
	uniqueId,
	uniqueSlug,
} from "../utils/test-id";
export {
	type CategoryFactoryOptions,
	createTestCategory,
} from "./category.factory";
export { createTestItem, type ItemFactoryOptions } from "./item.factory";
export {
	createTestMerchant,
	type MerchantFactoryOptions,
} from "./merchant.factory";
export {
	createTestOrder,
	type OrderFactoryOptions,
	type OrderItemInput,
	type OrderItemOptionInput,
} from "./order.factory";
export { createTestStore, type StoreFactoryOptions } from "./store.factory";
