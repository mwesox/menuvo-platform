import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(databaseUrl, {
	max: 20,
	idle_timeout: 30,
	connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;

// Transaction type for passing to services
type TransactionFn = Parameters<typeof db.transaction>[0];
export type Transaction = TransactionFn extends (tx: infer T) => unknown
	? T
	: never;
