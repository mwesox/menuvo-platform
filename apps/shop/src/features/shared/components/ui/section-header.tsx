/**
 * Section Header Component
 *
 * Reusable header for content sections with optional icon and subtitle.
 * Used for recommendations, category sections, and other titled areas.
 */

import { Box, HStack, VStack } from "@chakra-ui/react";
import type { ComponentType } from "react";
import { ShopHeading, ShopMutedText } from "./index";

interface SectionHeaderProps {
	title: string;
	icon?: ComponentType;
	subtitle?: string;
}

/**
 * Section header with optional icon and subtitle.
 *
 * @example
 * // Simple header
 * <SectionHeader title="Popular Items" />
 *
 * @example
 * // With icon
 * <SectionHeader title="Recommendations" icon={LuSparkles} />
 *
 * @example
 * // With icon and subtitle
 * <SectionHeader
 *   title="Suggestions for you"
 *   icon={LuSparkles}
 *   subtitle="Based on your cart"
 * />
 */
export function SectionHeader({
	title,
	icon: Icon,
	subtitle,
}: SectionHeaderProps) {
	const headerContent = (
		<HStack gap="2">
			{Icon && <Box as={Icon} boxSize="5" color="teal.solid" />}
			<ShopHeading as="h2" size="md">
				{title}
			</ShopHeading>
		</HStack>
	);

	if (subtitle) {
		return (
			<VStack align="start" gap="1">
				{headerContent}
				<ShopMutedText textStyle="sm">{subtitle}</ShopMutedText>
			</VStack>
		);
	}

	return headerContent;
}
