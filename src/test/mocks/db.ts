/**
 * Mock @/db module for client tests.
 * Prevents server-side environment variable access in jsdom environment.
 */

export const db = {
	query: {},
};

// Re-export empty schema for @/db/schema imports
export * from "./db-schema";
