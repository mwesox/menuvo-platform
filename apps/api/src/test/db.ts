/**
 * Test Database Setup using Testcontainers
 *
 * Spins up a real PostgreSQL container for integration tests.
 * @see https://node.testcontainers.org/modules/postgresql/
 */

import path from "node:path";
import type { Database } from "@menuvo/db";
import * as schema from "@menuvo/db/schema";
import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

let container: StartedPostgreSqlContainer | null = null;
let sql: postgres.Sql | null = null;
let _testDb: Database | null = null;

export async function setupTestDb() {
	// Start PostgreSQL container
	container = await new PostgreSqlContainer("postgres:16-alpine")
		.withDatabase("menuvo_test")
		.withUsername("test")
		.withPassword("test")
		.start();

	// Get connection URI (format: postgres://user:pass@host:port/database)
	const connectionUri = container.getConnectionUri();

	// Create postgres.js connection
	sql = postgres(connectionUri, {
		max: 5,
		idle_timeout: 10,
		connect_timeout: 5,
	});

	// Create Drizzle ORM instance with schema
	// Cast to Database type for compatibility with services
	_testDb = drizzle(sql, { schema }) as unknown as Database;

	// Run all migrations from packages/db/drizzle
	const migrationsFolder = path.resolve(
		import.meta.dirname,
		"../../../../packages/db/drizzle",
	);
	await migrate(_testDb, { migrationsFolder });

	return { testDb: _testDb, connectionUri };
}

export async function teardownTestDb() {
	// Close database connection first
	if (sql) {
		await sql.end();
		sql = null;
	}
	// Stop and remove the container
	if (container) {
		await container.stop();
		container = null;
	}
	_testDb = null;
}

export function getTestDb(): Database {
	if (!_testDb) {
		throw new Error("Test database not initialized. Call setupTestDb() first.");
	}
	return _testDb;
}
