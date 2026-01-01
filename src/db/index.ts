import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";

import { env } from "@/env";
import * as schema from "./schema.ts";

const sql = new SQL({
	url: env.DATABASE_URL,
	max: 20, // Max concurrent connections
	idleTimeout: 30, // Close idle connections after 30s
	connectionTimeout: 10, // Connection timeout 10s
});

export const db = drizzle(sql, { schema });
