import { Box, Button, Heading, Icon, Text, VStack } from "@chakra-ui/react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertCircle, RefreshCw } from "lucide-react";
import { i18n } from "@/i18n";

interface ConsoleErrorProps extends ErrorComponentProps {
	/** Custom title override */
	title?: string;
	/** Custom description override */
	description?: string;
}

/**
 * Error component for Console routes.
 * Shows a centered error message with retry button.
 * Uses i18n instance directly (not hook) since error components may render outside React tree.
 */
export function ConsoleError({ reset, title, description }: ConsoleErrorProps) {
	// Use i18n instance directly instead of hook (error components may be outside React context)
	// Safe fallback: if i18n isn't initialized or fails, use fallback strings
	const t = (key: string, fallback: string): string => {
		try {
			if (i18n?.isInitialized) {
				const translated = i18n.t(key, {
					ns: "common",
					defaultValue: fallback,
				});
				return translated || fallback;
			}
		} catch {
			// Silently fall back to English
		}
		return fallback;
	};

	return (
		<VStack
			minH="50vh"
			align="center"
			justify="center"
			px="4"
			textAlign="center"
		>
			<Box
				mb="4"
				display="flex"
				w="14"
				h="14"
				alignItems="center"
				justifyContent="center"
				rounded="full"
				bg="bg.error"
			>
				<Icon w="7" h="7" color="fg.error">
					<AlertCircle />
				</Icon>
			</Box>
			<Heading as="h2" fontWeight="semibold" textStyle="xl" color="fg">
				{title ?? t("error.title", "Something went wrong")}
			</Heading>
			<Text mt="2" maxW="md" color="fg.muted">
				{description ??
					t(
						"error.description",
						"We couldn't load this page. Please try again.",
					)}
			</Text>
			<Button mt="6" onClick={reset}>
				<Icon w="4" h="4" me="2">
					<RefreshCw />
				</Icon>
				{t("error.tryAgain", "Try again")}
			</Button>
		</VStack>
	);
}
