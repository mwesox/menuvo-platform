import { Box, Card, DataList, Heading, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface SettingsRowGroupProps {
	/** Section title */
	title: string;
	/** Children should be SettingsRowItem components */
	children: ReactNode;
}

/**
 * A group of settings rows with a title and card wrapper.
 * Uses Chakra UI DataList for semantic structure.
 */
export function SettingsRowGroup({ title, children }: SettingsRowGroupProps) {
	return (
		<Box>
			<Heading as="h3" fontWeight="semibold" textStyle="base" mb="3">
				{title}
			</Heading>
			<Card.Root variant="outline">
				<DataList.Root orientation="horizontal" divideY="1px">
					{children}
				</DataList.Root>
			</Card.Root>
		</Box>
	);
}

interface SettingsRowItemProps {
	/** Primary label for the row */
	label: string;
	/** Optional description below the label */
	description?: string;
	/** Action element - typically a Switch, Button, or Badge */
	action?: ReactNode;
}

/**
 * A single settings row item with label, description, and action.
 * Should be used inside SettingsRowGroup.
 */
export function SettingsRowItem({
	label,
	description,
	action,
}: SettingsRowItemProps) {
	return (
		<DataList.Item px="4" py="3" alignItems="center" gap="4">
			<DataList.ItemLabel flex="1" minW="0">
				<Text fontWeight="medium" textStyle="sm">
					{label}
				</Text>
				{description && (
					<Text mt="0.5" color="fg.muted" textStyle="sm">
						{description}
					</Text>
				)}
			</DataList.ItemLabel>
			{action && (
				<DataList.ItemValue flexShrink="0">{action}</DataList.ItemValue>
			)}
		</DataList.Item>
	);
}
