import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

/**
 * Shop Theme - Modern Quick Service
 *
 * Design: Clean, minimal, high-contrast - inspired by Wolt, Uber Eats
 * Universal ordering app: restaurants, food trucks, concerts, events
 *
 * Primary: Deep Teal for trust and freshness
 * Light mode only - clean white backgrounds
 */

const themeConfig = defineConfig({
	theme: {
		tokens: {
			colors: {
				// Background: Pure clean white
				background: {
					value: "oklch(0.99 0.002 240)",
				},
				card: {
					value: "oklch(1 0 0)",
				},
				popover: {
					value: "oklch(1 0 0)",
				},
				// Text: High contrast black
				foreground: {
					value: "oklch(0.13 0.01 260)",
				},
				"card-foreground": {
					value: "oklch(0.13 0.01 260)",
				},
				"popover-foreground": {
					value: "oklch(0.13 0.01 260)",
				},
				// Muted
				muted: {
					value: "oklch(0.965 0.005 260)",
				},
				"muted-foreground": {
					value: "oklch(0.45 0.01 260)",
				},
				// Primary: Deep Teal - accessible contrast with white text (4.8:1+)
				primary: {
					value: "oklch(0.52 0.155 185)",
				},
				"primary-foreground": {
					value: "oklch(0.99 0 0)",
				},
				// Secondary: Soft teal tint for backgrounds
				secondary: {
					value: "oklch(0.96 0.03 190)",
				},
				"secondary-foreground": {
					value: "oklch(0.35 0.08 190)",
				},
				// Destructive
				destructive: {
					value: "oklch(0.55 0.22 25)",
				},
				"destructive-foreground": {
					value: "oklch(0.99 0 0)",
				},
				// Borders and inputs
				border: {
					value: "oklch(0.92 0.005 260)",
				},
				input: {
					value: "oklch(0.92 0.005 260)",
				},
				ring: {
					value: "oklch(0.52 0.155 185)",
				},
				// Semantic colors
				success: {
					value: "oklch(0.6 0.18 155)",
				},
				"success-foreground": {
					value: "oklch(0.99 0 0)",
				},
				warning: {
					value: "oklch(0.75 0.15 85)",
				},
				"warning-foreground": {
					value: "oklch(0.15 0.02 85)",
				},
			},
			radii: {
				radius: {
					value: "0.5rem",
				},
			},
			fonts: {
				heading: {
					value:
						'"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
				},
				body: {
					value:
						'"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
				},
			},
		},
		textStyles: {
			xs: {
				value: {
					fontSize: "0.75rem",
					lineHeight: "1rem",
				},
			},
			sm: {
				value: {
					fontSize: "0.875rem",
					lineHeight: "1.25rem",
				},
			},
			md: {
				value: {
					fontSize: "1rem",
					lineHeight: "1.5rem",
				},
			},
			lg: {
				value: {
					fontSize: "1.125rem",
					lineHeight: "1.75rem",
				},
			},
			xl: {
				value: {
					fontSize: "1.25rem",
					lineHeight: "1.75rem",
				},
			},
			"2xl": {
				value: {
					fontSize: "1.5rem",
					lineHeight: "2rem",
				},
			},
			"3xl": {
				value: {
					fontSize: "1.875rem",
					lineHeight: "2.25rem",
				},
			},
		},
		semanticTokens: {
			colors: {
				// Base semantic tokens (light mode only)
				bg: {
					value: "{colors.background}",
				},
				fg: {
					value: "{colors.foreground}",
				},
				border: {
					value: "{colors.border}",
				},
				// Panel and surface tokens
				"bg.panel": {
					value: "{colors.card}",
				},
				"bg.muted": {
					value: "{colors.muted}",
				},
				"bg.subtle": {
					value: "oklch(0.97 0.003 260)",
				},
				"fg.muted": {
					value: "{colors.muted-foreground}",
				},
				"fg.subtle": {
					value: "oklch(0.5 0.01 260)",
				},
				"border.muted": {
					value: "oklch(0.94 0.003 260)",
				},
				// State tokens
				"bg.hover": {
					value: "{colors.muted}",
				},
				"bg.pressed": {
					value: "oklch(0.94 0.005 260)",
				},
				// Error states
				"bg.error": {
					value: "oklch(0.95 0.02 25)",
				},
				"fg.error": {
					value: "{colors.destructive}",
				},
				"border.error": {
					value: "{colors.destructive}",
				},
				// Success states
				"bg.success": {
					value: "oklch(0.95 0.02 155)",
				},
				"fg.success": {
					value: "{colors.success}",
				},
				"border.success": {
					value: "{colors.success}",
				},
				// Warning states
				"bg.warning": {
					value: "oklch(0.95 0.02 85)",
				},
				"fg.warning": {
					value: "{colors.warning}",
				},
				"border.warning": {
					value: "{colors.warning}",
				},
				// Teal color palette for buttons
				"teal.solid": {
					value: "{colors.primary}",
				},
				"teal.fg": {
					value: "{colors.primary-foreground}",
				},
				"teal.subtle": {
					value: "{colors.secondary}",
				},
				"teal.muted": {
					value: "oklch(0.94 0.04 185)",
				},
				// Green for success indicators
				"green.solid": {
					value: "{colors.success}",
				},
				"green.fg": {
					value: "{colors.success-foreground}",
				},
			},
		},
	},
});

export const system = createSystem(defaultConfig, themeConfig);
