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
				test: {
					name: "client",
					environment: "jsdom",
					include: ["src/**/*.test.tsx"],
					setupFiles: ["./vitest.setup.ts"],
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
