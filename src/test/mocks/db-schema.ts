/**
 * Mock @/db/schema module for client tests.
 * Provides empty schema objects to satisfy imports.
 */

export const categories = {};
export const items = {};
export const itemOptionGroups = {};
export const optionChoices = {};
export const stores = {};
export const merchants = {};
export const storeHours = {};
export const storeClosures = {};
export const optionGroups = {};
export const orders = {};
export const orderItems = {};
export const menuImportJobs = {};

// Type exports (empty objects since only used for typing)
export type EntityTranslations = Record<string, unknown>;
export type ChoiceTranslations = Record<string, unknown>;
export type StoreHour = Record<string, unknown>;
export type DayOfWeek = string;
