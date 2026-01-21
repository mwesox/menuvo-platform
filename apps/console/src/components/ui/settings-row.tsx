import { Box, Card, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface SettingsRowGroupProps {
	/** Optional section title */
	title?: string;
	/** Children should be SettingsRowItem components */
	children: ReactNode;
}

/**
 * A group of settings rows with a title and card wrapper.
 * Uses Chakra UI DataList for semantic structure.
 *
 * Spacing:
 * - Minimal gap (mb="1" = 4px) between title and card - they belong together
 * - Parent provides larger gap between sections (gap="8" = 32px)
 */
export function SettingsRowGroup({ title, children }: SettingsRowGroupProps) {
	return (
		<Box>
			{title && (
				<Heading as="h2" textStyle="sectionTitle" mb="1.5">
					{title}
				</Heading>
			)}
			<Card.Root variant="outline">
				<VStack align="stretch" gap="0" divideY="1px">
					{children}
				</VStack>
			</Card.Root>
		</Box>
	);
}

interface SettingsRowItemProps {
	/** Primary label for the row */
	label: ReactNode;
	/** Optional description below the label */
	description?: string;
	/** Action element - typically a Switch, Button, or Badge */
	action?: ReactNode;
}

/**
 * A single settings row item with label, description, and action.
 * Should be used inside SettingsRowGroup.
 *
 * Layout: Label and description stack vertically on the left, action aligns to top-right.
 */
export function SettingsRowItem({
	label,
	description,
	action,
}: SettingsRowItemProps) {
	return (
		<HStack px="4" py="3" gap="4" justify="space-between" align="flex-start">
			<VStack align="start" gap="1" flex="1" minW="0">
				{typeof label === "string" ? (
					<Text textStyle="label">{label}</Text>
				) : (
					label
				)}
				{description && <Text textStyle="caption">{description}</Text>}
			</VStack>
			{action && <Box flexShrink="0">{action}</Box>}
		</HStack>
	);
}
