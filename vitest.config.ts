import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		globals: true,
		// Use projects to separate client (jsdom) and server (node) tests
		projects: [
			{
				extends: true,
				resolve: {
					alias: {
						// Mock server-side modules for client tests at vite resolution level
						"@/db/schema.ts": resolve(__dirname, "src/test/mocks/db-schema.ts"),
						"@/db/schema": resolve(__dirname, "src/test/mocks/db-schema.ts"),
						"@/db": resolve(__dirname, "src/test/mocks/db.ts"),
					},
				},
				test: {
					name: "client",
					environment: "jsdom",
					include: ["src/**/*.test.tsx"],
					setupFiles: ["./vitest.setup.ts"],
					server: {
						deps: {
							inline: ["zod"],
						},
					},
				},
			},
			{
				extends: true,
				test: {
					name: "server",
					environment: "node",
					include: ["src/**/*.test.ts"],
					exclude: ["src/**/*.test.tsx"],
					setupFiles: ["./src/test/setup.ts"],
					// Run server tests sequentially to avoid connection pool issues
					pool: "forks",
					poolOptions: {
						forks: {
							singleFork: true,
						},
					},
					server: {
						deps: {
							inline: ["zod"],
						},
					},
				},
			},
		],
	},
});
