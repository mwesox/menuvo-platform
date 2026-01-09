/**
 * API Context Creation
 *
 * Creates the tRPC context for each request.
 * Handles session extraction from cookies/headers and service injection.
 */

import type { db } from "@menuvo/db";
import type { Context, MenuImportService, StorageService } from "@menuvo/trpc";
import type { Context as HonoContext } from "hono";
import { extractSession } from "./services/auth/session.service.js";
import { processMenuImportJob } from "./services/menu-import/index.js";
import { createStorageService } from "./services/storage/s3.service.js";

interface CreateContextOptions {
	db: typeof db;
	req: Request;
}

// Create singleton storage service instance
const storageService: StorageService = createStorageService();

// Create singleton menu import service instance
const menuImportService: MenuImportService = {
	processJob: processMenuImportJob,
};

/**
 * Creates the tRPC context for a request
 * @param opts - Context creation options
 * @param c - Hono context (optional, provided by @hono/trpc-server)
 */
export async function createContext(
	opts: CreateContextOptions,
	c?: HonoContext,
): Promise<Context> {
	const session = await extractSession(opts.req);

	return {
		db: opts.db,
		session,
		storage: storageService,
		menuImport: menuImportService,
		c,
	};
}
