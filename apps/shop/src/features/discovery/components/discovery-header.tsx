import { Box, Flex } from "@chakra-ui/react";

/**
 * Minimal discovery header - logo is now in hero.
 * Reserved for future customer login button.
 */
export function DiscoveryHeader() {
	return (
		<Box as="header" position="absolute" top="0" left="0" right="0" zIndex="50">
			<Flex
				maxW="6xl"
				mx="auto"
				h="16"
				align="center"
				justify="flex-end"
				px={{ base: "4", sm: "6", lg: "8" }}
			>
				{/* Future: Login button will go here */}
			</Flex>
		</Box>
	);
}
