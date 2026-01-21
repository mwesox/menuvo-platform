import { ChakraProvider } from "@chakra-ui/react";
import { system } from "@/theme";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

/**
 * Provider - Root provider component for Chakra UI
 * Wraps ChakraProvider and ColorModeProvider in the correct order
 */
export function Provider({
	children,
	...colorModeProps
}: ColorModeProviderProps & { children: React.ReactNode }) {
	return (
		<ChakraProvider value={system}>
			<ColorModeProvider defaultTheme="light" {...colorModeProps}>
				{children}
			</ColorModeProvider>
		</ChakraProvider>
	);
}
