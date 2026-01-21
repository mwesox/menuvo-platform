import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { system } from "@/theme";

/**
 * Provider - Root provider component for Chakra UI
 *
 * Shop is light-mode only, so we use a simplified provider setup
 * without color mode toggling functionality.
 */
export function Provider({ children }: { children: React.ReactNode }) {
	return (
		<ChakraProvider value={system}>
			<ThemeProvider
				attribute="class"
				defaultTheme="light"
				forcedTheme="light"
				disableTransitionOnChange
			>
				{children}
			</ThemeProvider>
		</ChakraProvider>
	);
}
