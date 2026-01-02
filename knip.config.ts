import type { KnipConfig } from "knip";

const config: KnipConfig = {
	entry: [
		"src/routes/**/*.tsx",
		"src/router.tsx",
		"scripts/*.ts",
	],
	project: ["src/**/*.{ts,tsx}"],
	ignore: [
		"src/routeTree.gen.ts",
		"src/components/ui/**",
	],
	ignoreDependencies: [
		"tailwindcss", // Tailwind v4 CSS-based config
		"tw-animate-css", // CSS import only
		"@tanstack/router-plugin", // Used via @tanstack/react-start
		"@radix-ui/react-avatar", // shadcn deps
		"@radix-ui/react-tooltip",
		"shadcn", // CLI tool
		"web-vitals", // Performance monitoring
	],
	ignoreExportsUsedInFile: true,

	// Explicitly configure plugins
	vite: {
		config: ["vite.config.ts"],
	},
};

export default config;
