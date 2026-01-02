/**
 * Test database connection.
 * Uses postgres.js which works in both Node.js and Bun.
 *
 * This ensures factories and server functions use the same database.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

// Uses DATABASE_URL which is set to test database in setup.ts
const TEST_DATABASE_URL =
	process.env.DATABASE_URL ||
	"postgresql://postgres:postgres@localhost:5433/menuvo_test";

const sql = postgres(TEST_DATABASE_URL, {
	max: 5,
	idle_timeout: 10,
	connect_timeout: 5,
});

export const testDb = drizzle(sql, { schema });

/**
 * Close database connection (call in afterAll)
 */
export async function closeTestDb(): Promise<void> {
	await sql.end();
}

/**
 * Export for direct SQL access if needed
 */
export { sql as testSql };
