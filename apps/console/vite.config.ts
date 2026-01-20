import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
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
	// Pre-bundle heavy dependencies for faster dev server startup
	// and to optimize barrel file imports from @menuvo/ui
	optimizeDeps: {
		include: [
			"@menuvo/ui",
			"@radix-ui/react-dialog",
			"@radix-ui/react-dropdown-menu",
			"@radix-ui/react-select",
			"@radix-ui/react-tabs",
			"@radix-ui/react-tooltip",
			"@radix-ui/react-popover",
			"@radix-ui/react-accordion",
			"lucide-react",
			"motion/react",
			"date-fns",
			"i18next",
			"react-i18next",
		],
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
