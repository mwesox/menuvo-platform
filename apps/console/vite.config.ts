import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [TanStackRouterVite(), react(), tailwindcss()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
			"@/db": resolve(__dirname, "../../packages/db/src"),
		},
		dedupe: ["react", "react-dom"],
	},
	server: {
		port: 3000,
		proxy: {
			"/trpc": {
				target: "http://localhost:4000",
				changeOrigin: true,
			},
			"/api": {
				target: "http://localhost:4000",
				changeOrigin: true,
			},
		},
	},
	test: {
		environment: "jsdom",
	},
});
