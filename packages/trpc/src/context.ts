/**
 * tRPC Context
 *
 * This file defines the context that is passed to every tRPC procedure.
 * The context is created per-request and contains:
 * - Database connection
 * - Session/user information (if authenticated)
 * - Optional services (storage, etc.)
 *
 * Note: The database type is imported from @menuvo/db by the API app
 * and passed to createContext. This keeps the trpc package decoupled
 * from the specific database implementation.
 */

import type { Database } from "@menuvo/db";

/**
 * User session data available in authenticated procedures
 */
export interface Session {
	userId: string;
	merchantId: string;
	storeId?: string;
	role: "owner" | "staff" | "admin";
}

/**
 * Storage service interface for S3 operations.
 * Injected by the API app to keep tRPC package decoupled.
 */
export interface StorageService {
	/**
	 * Delete an image and all its variants from S3.
	 * @param key - The S3 key for the original image
	 */
	deleteImageVariants: (
		key: string,
	) => Promise<{ deleted: string[]; failed: string[]; notFound: string[] }>;
}

/**
 * Menu import service interface.
 * Injected by the API app to provide AI-powered menu extraction.
 */
export interface MenuImportService {
	/**
	 * Process a menu import job (AI extraction + comparison).
	 * @param jobId - The import job ID to process
	 */
	processJob: (jobId: string) => Promise<void>;
}

/**
 * Context available to all procedures
 */
export interface Context {
	/** Database instance */
	db: Database;
	/** User session (undefined if not authenticated) */
	session: Session | undefined;
	/** Storage service for S3 operations (optional, injected by API app) */
	storage?: StorageService;
	/** Menu import service for AI-powered menu extraction (optional, injected by API app) */
	menuImport?: MenuImportService;
	/** Response headers for setting cookies (from tRPC fetch adapter) */
	resHeaders?: Headers;
	/** Index signature to satisfy @hono/trpc-server's Record<string, unknown> constraint */
	[key: string]: unknown;
}

/**
 * Options for creating context
 */
export interface CreateContextOptions {
	db: Database;
	session?: Session;
	storage?: StorageService;
	menuImport?: MenuImportService;
	resHeaders?: Headers;
}

/**
 * Creates the context for a tRPC request
 */
export function createContext(opts: CreateContextOptions): Context {
	return {
		db: opts.db,
		session: opts.session,
		storage: opts.storage,
		menuImport: opts.menuImport,
		resHeaders: opts.resHeaders,
	};
}
