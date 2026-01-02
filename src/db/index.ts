import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";
import * as schema from "./schema.ts";

const sql = postgres(env.DATABASE_URL, {
	max: 20, // Max concurrent connections
	idle_timeout: 30, // Close idle connections after 30s
	connect_timeout: 10, // Connection timeout 10s
});

export const db = drizzle(sql, { schema });
