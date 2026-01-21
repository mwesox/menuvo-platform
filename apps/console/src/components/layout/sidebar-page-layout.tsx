import { Box, Button, Flex, HStack, VStack } from "@chakra-ui/react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface SidebarPageLayoutProps {
	/** URL to navigate back to (optional - hides back button if not provided) */
	backHref?: string;
	/** Label for the back button */
	backLabel?: string;
	/** Navigation sidebar content */
	nav: ReactNode;
	/** Main content area */
	children: ReactNode;
	/** Footer with save/cancel buttons - renders at bottom of content */
	footer?: ReactNode;
}

export function SidebarPageLayout({
	backHref,
	backLabel,
	nav,
	children,
	footer,
}: SidebarPageLayoutProps) {
	const showBackButton = backHref && backLabel;

	return (
		<Flex direction="column" minH="calc(100vh - 4rem)">
			{/* Back button header - only show if backHref provided */}
			{showBackButton && (
				<Box borderBottomWidth="1px" px="6" py="4">
					<Button variant="ghost" size="sm" asChild>
						<Link to={backHref}>
							<ArrowLeft
								style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }}
							/>
							{backLabel}
						</Link>
					</Button>
				</Box>
			)}

			{/* Two-column layout */}
			<Flex flex="1" direction={{ base: "column", lg: "row" }}>
				{/* Navigation sidebar - desktop */}
				<Box
					as="aside"
					display={{ base: "none", lg: "block" }}
					w="60"
					flexShrink="0"
					borderEndWidth="1px"
					bg="bg.muted"
					position="sticky"
					top="0"
					p="4"
				>
					{nav}
				</Box>

				{/* Mobile navigation - horizontal scroll */}
				<Box
					display={{ base: "block", lg: "none" }}
					w="full"
					borderBottomWidth="1px"
					px="3"
					py="2"
					overflowX="auto"
					className="scrollbar-hide"
				>
					<Box mx="-3" px="3">
						{nav}
					</Box>
				</Box>

				{/* Main content */}
				<Box as="main" flex="1">
					<Box px={{ base: "4", sm: "6", lg: "8" }} py={{ base: "4", sm: "6" }}>
						<VStack gap="6" align="stretch">
							{children}
						</VStack>

						{/* Footer - inside content area */}
						{footer && (
							<Box mt="6" borderTopWidth="1px" pt="6">
								<HStack justify="flex-end" gap="3">
									{footer}
								</HStack>
							</Box>
						)}
					</Box>
				</Box>
			</Flex>
		</Flex>
	);
}
