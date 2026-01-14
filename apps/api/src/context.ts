/**
 * API Context Creation
 *
 * Creates the tRPC context for each request.
 * Handles session extraction from cookies/headers and service injection.
 */

import type { Database } from "@menuvo/db";
import { db } from "@menuvo/db";
import { getServerUrl } from "./domains/payments/mollie.js";
import { DomainServices } from "./domains/services.js";
import { extractSession } from "./infrastructure/auth/session.service.js";

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
 * Context available to all procedures.
 *
 * Services are accessed through the `services` aggregator.
 */
export interface Context extends Record<string, unknown> {
	/** Database instance */
	db: Database;
	/** User session (undefined if not authenticated) */
	session: Session | undefined;
	/** Domain services aggregator */
	services: DomainServices;
	/** Response headers for setting cookies */
	resHeaders?: Headers;
	/** Server URL for webhooks */
	serverUrl?: string;
}

interface CreateContextOptions {
	db: typeof db;
	req: Request;
}

// Create singleton DomainServices instance
const services = new DomainServices({ db });

/**
 * Creates the tRPC context for a request
 * @param opts - Context creation options (from @hono/trpc-server, includes resHeaders)
 */
export async function createContext(
	opts: CreateContextOptions & { resHeaders?: Headers },
): Promise<Context> {
	const session = await extractSession(opts.req);

	return {
		db: opts.db,
		session,
		services,
		resHeaders: opts.resHeaders,
		serverUrl: getServerUrl(),
	};
}
