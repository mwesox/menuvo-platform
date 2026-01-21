import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

/**
 * Console Theme - "Zinc/Stone + Red Accent"
 *
 * A sophisticated, modern palette using:
 * - Zinc/Stone neutrals (hue 270°) for backgrounds and surfaces
 * - Dark gray (#2D2D2D) as primary
 * - Brand red (#D42027) as accent
 *
 * Supports: Light mode and Dark mode
 */

const themeConfig = defineConfig({
	theme: {
		tokens: {
			colors: {
				// Core colors - Light mode (Zinc/Stone palette)
				background: {
					value: "oklch(0.985 0.002 270)",
				},
				foreground: {
					value: "oklch(0.205 0.02 240)",
				},
				card: {
					value: "oklch(0.995 0.001 270)",
				},
				"card-foreground": {
					value: "oklch(0.205 0.02 240)",
				},
				popover: {
					value: "oklch(0.995 0.001 270)",
				},
				"popover-foreground": {
					value: "oklch(0.205 0.02 240)",
				},
				// Primary - Logo Dark Gray (#2D2D2D)
				primary: {
					value: "oklch(0.25 0.01 280)",
				},
				"primary-foreground": {
					value: "oklch(0.99 0 0)",
				},
				// Secondary - Cool Zinc
				secondary: {
					value: "oklch(0.94 0.008 270)",
				},
				"secondary-foreground": {
					value: "oklch(0.3 0.02 240)",
				},
				// Muted - Soft zinc gray
				muted: {
					value: "oklch(0.96 0.005 270)",
				},
				"muted-foreground": {
					value: "oklch(0.5 0.02 240)",
				},
				// Accent - Brand Red (#D42027)
				accent: {
					value: "oklch(0.55 0.22 27)",
				},
				"accent-foreground": {
					value: "oklch(0.99 0 0)",
				},
				// Destructive - Tomato Red
				destructive: {
					value: "oklch(0.52 0.2 30)",
				},
				"destructive-foreground": {
					value: "oklch(0.98 0 0)",
				},
				// UI Elements
				border: {
					value: "oklch(0.88 0.008 270)",
				},
				input: {
					value: "oklch(0.4 0.02 270)",
				},
				ring: {
					value: "oklch(0.25 0.01 280)",
				},
				// Extended semantic colors
				success: {
					value: "oklch(0.62 0.17 145)",
				},
				"success-foreground": {
					value: "oklch(0.99 0 0)",
				},
				warning: {
					value: "oklch(0.78 0.16 80)",
				},
				"warning-foreground": {
					value: "oklch(0.25 0.04 80)",
				},
				// Brand colors
				"brand-red": {
					value: "oklch(0.55 0.22 27)",
				},
				"brand-red-dark": {
					value: "oklch(0.48 0.2 27)",
				},
				"brand-red-light": {
					value: "oklch(0.68 0.18 20)",
				},
				"brand-red-lighter": {
					value: "oklch(0.72 0.16 18)",
				},
				"brand-orange": {
					value: "oklch(0.77 0.17 65)",
				},
				"brand-dark": {
					value: "oklch(0.15 0.01 280)",
				},
				// Sidebar colors
				sidebar: {
					value: "oklch(0.97 0.004 270)",
				},
				"sidebar-foreground": {
					value: "oklch(0.25 0.02 240)",
				},
				"sidebar-primary": {
					value: "oklch(0.25 0.01 280)",
				},
				"sidebar-primary-foreground": {
					value: "oklch(0.99 0 0)",
				},
				"sidebar-accent": {
					value: "oklch(0.55 0.22 27)",
				},
				"sidebar-accent-foreground": {
					value: "oklch(0.99 0 0)",
				},
				"sidebar-border": {
					value: "oklch(0.9 0.008 270)",
				},
				"sidebar-ring": {
					value: "oklch(0.25 0.01 280)",
				},
			},
			radii: {
				radius: {
					value: "0.5rem",
				},
			},
			fonts: {
				heading: {
					value: '"Inter", ui-sans-serif, system-ui, sans-serif',
				},
				body: {
					value: '"Inter", ui-sans-serif, system-ui, sans-serif',
				},
			},
		},
		textStyles: {
			// Typography scale aligned with Chakra UI defaults
			// Used for consistent text sizing across the application
			xs: {
				value: {
					fontSize: "0.75rem", // 12px
					lineHeight: "1rem", // 16px
				},
			},
			sm: {
				value: {
					fontSize: "0.875rem", // 14px
					lineHeight: "1.25rem", // 20px
				},
			},
			md: {
				value: {
					fontSize: "1rem", // 16px
					lineHeight: "1.5rem", // 24px
				},
			},
			lg: {
				value: {
					fontSize: "1.125rem", // 18px
					lineHeight: "1.75rem", // 28px
				},
			},
			xl: {
				value: {
					fontSize: "1.25rem", // 20px
					lineHeight: "1.75rem", // 28px
				},
			},
			"2xl": {
				value: {
					fontSize: "1.5rem", // 24px
					lineHeight: "2rem", // 32px
				},
			},
			"3xl": {
				value: {
					fontSize: "1.875rem", // 30px
					lineHeight: "2.25rem", // 36px
				},
			},
			"4xl": {
				value: {
					fontSize: "2.25rem", // 36px
					lineHeight: "2.5rem", // 40px
				},
			},
			// Page title - H1
			pageTitle: {
				value: {
					fontSize: "1.25rem", // 20px (xl)
					lineHeight: "1.75rem", // 28px
					fontWeight: "600", // semibold
				},
			},
			// Section title - H2 (uppercase label style, but bolder)
			sectionTitle: {
				value: {
					fontSize: "0.75rem", // 12px (xs)
					lineHeight: "1rem", // 16px
					fontWeight: "700", // bold
					textTransform: "uppercase",
					letterSpacing: "0.05em", // wider
					color: "var(--colors-fg-subtle)", // darker than fg.muted
				},
			},
			// Label - form labels and settings row labels (medium weight)
			label: {
				value: {
					fontSize: "0.875rem", // 14px (sm)
					lineHeight: "1.25rem", // 20px
					fontWeight: "500", // medium
				},
			},
			// Label muted - secondary labels
			"label.muted": {
				value: {
					fontSize: "0.875rem", // 14px (sm)
					lineHeight: "1.25rem", // 20px
					fontWeight: "500", // medium
					color: "var(--colors-fg-muted)",
				},
			},
			// Caption - helper text, descriptions
			caption: {
				value: {
					fontSize: "0.875rem", // 14px (sm)
					lineHeight: "1.25rem", // 20px
					color: "var(--colors-fg-muted)",
				},
			},
		},
		layerStyles: {
			// Standard page content wrapper
			pageContent: {
				value: {
					display: "flex",
					flexDirection: "column",
					gap: "6",
					width: "100%",
				},
			},
			// Settings page content wrapper with max width
			settingsContent: {
				value: {
					display: "flex",
					flexDirection: "column",
					gap: "6",
					maxWidth: "768px",
					width: "100%",
				},
			},
			// Form section with card styling
			formSection: {
				value: {
					borderWidth: "1px",
					borderRadius: "lg",
					padding: "4",
				},
			},
			// Settings row (for toggles/actions)
			settingsRow: {
				value: {
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					paddingX: "4",
					paddingY: "3",
				},
			},
		},
		semanticTokens: {
			colors: {
				// Base semantic tokens
				bg: {
					value: {
						_light: "{colors.background}",
						_dark: "oklch(0.17 0.02 240)",
					},
				},
				fg: {
					value: {
						_light: "{colors.foreground}",
						_dark: "oklch(0.94 0.01 90)",
					},
				},
				border: {
					value: {
						_light: "{colors.border}",
						_dark: "oklch(0.3 0.02 240)",
					},
				},
				// Panel and surface tokens
				"bg.panel": {
					value: {
						_light: "{colors.card}",
						_dark: "oklch(0.2 0.02 240)",
					},
				},
				"bg.muted": {
					value: {
						_light: "{colors.muted}",
						_dark: "oklch(0.28 0.02 240)",
					},
				},
				"bg.subtle": {
					value: {
						_light: "oklch(0.97 0.004 270)",
						_dark: "oklch(0.22 0.02 240)",
					},
				},
				"fg.muted": {
					value: {
						_light: "{colors.muted-foreground}",
						_dark: "oklch(0.6 0.01 90)",
					},
				},
				"fg.subtle": {
					value: {
						_light: "oklch(0.45 0.02 240)",
						_dark: "oklch(0.65 0.01 90)",
					},
				},
				"border.muted": {
					value: {
						_light: "oklch(0.9 0.008 270)",
						_dark: "oklch(0.32 0.02 240)",
					},
				},
				// State tokens - Interactive states
				"bg.hover": {
					value: {
						_light: "{colors.muted}",
						_dark: "oklch(0.25 0.02 240)",
					},
				},
				"bg.pressed": {
					value: {
						_light: "oklch(0.92 0.006 270)",
						_dark: "oklch(0.3 0.02 240)",
					},
				},
				"bg.disabled": {
					value: {
						_light: "oklch(0.96 0.004 270)",
						_dark: "oklch(0.24 0.02 240)",
					},
				},
				"fg.disabled": {
					value: {
						_light: "oklch(0.65 0.008 270)",
						_dark: "oklch(0.5 0.01 90)",
					},
				},
				"border.focus": {
					value: {
						_light: "{colors.ring}",
						_dark: "oklch(0.85 0.01 280)",
					},
				},
				"border.hover": {
					value: {
						_light: "oklch(0.82 0.008 270)",
						_dark: "oklch(0.35 0.02 240)",
					},
				},
				// Error states
				"bg.error": {
					value: {
						_light: "oklch(0.95 0.02 30)",
						_dark: "oklch(0.25 0.05 30)",
					},
				},
				"fg.error": {
					value: {
						_light: "{colors.destructive}",
						_dark: "oklch(0.65 0.2 30)",
					},
				},
				"border.error": {
					value: {
						_light: "{colors.destructive}",
						_dark: "oklch(0.6 0.18 30)",
					},
				},
				// Warning states
				"bg.warning": {
					value: {
						_light: "oklch(0.95 0.02 80)",
						_dark: "oklch(0.25 0.04 80)",
					},
				},
				"fg.warning": {
					value: {
						_light: "{colors.warning}",
						_dark: "oklch(0.8 0.15 80)",
					},
				},
				"border.warning": {
					value: {
						_light: "{colors.warning}",
						_dark: "oklch(0.75 0.14 80)",
					},
				},
				// Success states
				"bg.success": {
					value: {
						_light: "oklch(0.95 0.02 145)",
						_dark: "oklch(0.25 0.04 145)",
					},
				},
				"fg.success": {
					value: {
						_light: "{colors.success}",
						_dark: "oklch(0.7 0.16 145)",
					},
				},
				"border.success": {
					value: {
						_light: "{colors.success}",
						_dark: "oklch(0.68 0.16 145)",
					},
				},
				// Info states
				"bg.info": {
					value: {
						_light: "oklch(0.95 0.02 240)",
						_dark: "oklch(0.25 0.04 240)",
					},
				},
				"fg.info": {
					value: {
						_light: "oklch(0.5 0.15 240)",
						_dark: "oklch(0.7 0.15 240)",
					},
				},
				"border.info": {
					value: {
						_light: "oklch(0.5 0.15 240)",
						_dark: "oklch(0.65 0.15 240)",
					},
				},
				// Component-specific tokens
				// Switch unchecked track background - needs good contrast against card/panel backgrounds
				"bg.emphasized": {
					value: {
						_light: "oklch(0.75 0.008 270)", // Visible zinc gray for light mode
						_dark: "oklch(0.35 0.02 240)", // Visible gray for dark mode
					},
				},
			},
		},
	},
});

export const system = createSystem(defaultConfig, themeConfig);
