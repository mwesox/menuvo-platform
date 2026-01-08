/**
 * API Context Creation
 *
 * Creates the tRPC context for each request.
 * Handles session extraction from cookies/headers and service injection.
 */

import type { db } from "@menuvo/db";
import type { Context, Session, StorageService } from "@menuvo/trpc";
import { createStorageService } from "./services/storage/s3.service.js";

interface CreateContextOptions {
	db: typeof db;
	req: Request;
}

// Create singleton storage service instance
const storageService: StorageService = createStorageService();

/**
 * Extract session from request
 * TODO: Implement actual session extraction from cookies/JWT
 */
async function getSession(req: Request): Promise<Session | undefined> {
	// Check for authorization header
	const authHeader = req.headers.get("authorization");
	if (!authHeader) {
		return undefined;
	}

	// TODO: Validate JWT/session token and return session data
	// For now, return undefined (no session)
	return undefined;
}

/**
 * Creates the tRPC context for a request
 */
export async function createContext(
	opts: CreateContextOptions,
): Promise<Context> {
	const session = await getSession(opts.req);

	return {
		db: opts.db,
		session,
		storage: storageService,
	};
}
