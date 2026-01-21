import { Box, type BoxProps, Center } from "@chakra-ui/react";
import { forwardRef } from "react";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

interface PageContainerProps extends BoxProps {
	/** Container max width: sm=lg, md=2xl, lg=4xl, xl=6xl, full=none */
	size?: ContainerSize;
	/** Whether to center content vertically (for confirmation pages) */
	centered?: boolean;
}

const sizeToMaxW: Record<ContainerSize, BoxProps["maxW"]> = {
	sm: "lg",
	md: "2xl",
	lg: "4xl",
	xl: "6xl",
	full: undefined,
};

/**
 * Consistent page container with centered content and responsive padding.
 *
 * @example
 * // Standard page (ordering, checkout)
 * <PageContainer size="md">
 *   <Content />
 * </PageContainer>
 *
 * @example
 * // Wide page (discovery, menu)
 * <PageContainer size="xl">
 *   <Content />
 * </PageContainer>
 *
 * @example
 * // Centered confirmation page
 * <PageContainer size="sm" centered>
 *   <ConfirmationCard />
 * </PageContainer>
 */
export const PageContainer = forwardRef<HTMLDivElement, PageContainerProps>(
	({ size = "md", centered = false, children, ...props }, ref) => {
		const maxW = sizeToMaxW[size];

		// Use smaller padding for smaller containers
		const isSmallContainer = size === "sm" || size === "md";
		const px = isSmallContainer ? "4" : { base: "4", sm: "6", lg: "8" };

		// Default vertical padding
		const py = props.py ?? "6";

		if (centered) {
			return (
				<Center minH="100vh" px={px} py={py} ref={ref} {...props}>
					<Box w="full" maxW={maxW}>
						{children}
					</Box>
				</Center>
			);
		}

		return (
			<Box ref={ref} maxW={maxW} mx="auto" px={px} py={py} {...props}>
				{children}
			</Box>
		);
	},
);
PageContainer.displayName = "PageContainer";

export type { PageContainerProps, ContainerSize };
