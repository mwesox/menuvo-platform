"use client";

import type { IconButtonProps } from "@chakra-ui/react";
import { ClientOnly, IconButton, Skeleton } from "@chakra-ui/react";
import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider, useTheme } from "next-themes";
import * as React from "react";
import { LuMoon, LuSun } from "react-icons/lu";

export interface ColorModeProviderProps extends ThemeProviderProps {}

/**
 * ColorModeProvider - Chakra UI v3 compatible color mode provider
 * Uses next-themes under the hood as recommended by Chakra v3
 */
export function ColorModeProvider({
	children,
	defaultTheme = "light",
	enableSystem = false,
	disableTransitionOnChange = true,
	storageKey = "chakra-ui-color-mode",
	...props
}: ColorModeProviderProps) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme={defaultTheme}
			enableSystem={enableSystem}
			disableTransitionOnChange={disableTransitionOnChange}
			storageKey={storageKey}
			{...props}
		>
			{children}
		</ThemeProvider>
	);
}

export type ColorMode = "light" | "dark";

export interface UseColorModeReturn {
	colorMode: ColorMode;
	setColorMode: (colorMode: ColorMode) => void;
	toggleColorMode: () => void;
}

/**
 * useColorMode - Hook to access and control color mode
 * Compatible with Chakra UI v3 pattern using next-themes
 */
export function useColorMode(): UseColorModeReturn {
	const { resolvedTheme, setTheme, forcedTheme } = useTheme();
	const colorMode = (forcedTheme || resolvedTheme || "light") as ColorMode;

	const toggleColorMode = React.useCallback(() => {
		setTheme(resolvedTheme === "dark" ? "light" : "dark");
	}, [resolvedTheme, setTheme]);

	const setColorMode = React.useCallback(
		(mode: ColorMode) => {
			setTheme(mode);
		},
		[setTheme],
	);

	return {
		colorMode,
		setColorMode,
		toggleColorMode,
	};
}

/**
 * useColorModeValue - Returns different values based on current color mode
 * Compatible with Chakra UI v3 pattern
 */
export function useColorModeValue<T>(light: T, dark: T): T {
	const { colorMode } = useColorMode();
	return colorMode === "dark" ? dark : light;
}

/**
 * ColorModeIcon - Icon component that changes based on color mode
 */
export function ColorModeIcon() {
	const { colorMode } = useColorMode();
	return colorMode === "dark" ? <LuMoon /> : <LuSun />;
}

interface ColorModeButtonProps extends Omit<IconButtonProps, "aria-label"> {}

/**
 * ColorModeButton - Button component to toggle color mode
 */
export const ColorModeButton = React.forwardRef<
	HTMLButtonElement,
	ColorModeButtonProps
>(function ColorModeButton(props, ref) {
	const { toggleColorMode } = useColorMode();
	return (
		<ClientOnly fallback={<Skeleton boxSize="9" />}>
			<IconButton
				onClick={toggleColorMode}
				variant="ghost"
				aria-label="Toggle color mode"
				size="sm"
				ref={ref}
				{...props}
			>
				<ColorModeIcon />
			</IconButton>
		</ClientOnly>
	);
});
