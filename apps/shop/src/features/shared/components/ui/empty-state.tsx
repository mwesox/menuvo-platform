/**
 * Empty State Component
 *
 * Consolidated empty state component for the shop app.
 * Use for error pages, empty lists, and no-results states.
 */

import { Box, Button, Center, Circle, VStack } from "@chakra-ui/react";
import type { ComponentType } from "react";
import { ShopButton, ShopHeading, ShopMutedText } from "./index";

interface EmptyStateAction {
	label: string;
	onClick: () => void;
}

interface EmptyStateProps {
	/** Icon component to display */
	icon: ComponentType;
	/** Main title text */
	title: string;
	/** Optional description text */
	description?: string;
	/** Primary action button */
	action?: EmptyStateAction;
	/** Secondary action link */
	secondaryAction?: EmptyStateAction;
	/** Layout variant: "page" for full-page centered, "inline" for list empty states */
	variant?: "page" | "inline";
}

/**
 * Reusable empty state component.
 *
 * Use `variant="page"` for error pages and full-page states (centered with minH).
 * Use `variant="inline"` for empty lists and inline states (padding only).
 */
export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	secondaryAction,
	variant = "inline",
}: EmptyStateProps) {
	const content = (
		<VStack gap={variant === "page" ? "0" : "4"} textAlign="center">
			<Circle size="16" bg="bg.muted" mb={variant === "page" ? "4" : "0"}>
				<Box as={Icon} boxSize="8" color="fg.muted" />
			</Circle>
			<ShopHeading size="xl">{title}</ShopHeading>
			{description && (
				<ShopMutedText mt={variant === "page" ? "2" : "-2"} maxW="sm">
					{description}
				</ShopMutedText>
			)}
			{action && (
				<ShopButton
					variant="primary"
					size="md"
					onClick={action.onClick}
					mt={variant === "page" ? "4" : "0"}
				>
					{action.label}
				</ShopButton>
			)}
			{secondaryAction && (
				<Button
					variant="plain"
					colorPalette="teal"
					mt={variant === "page" ? "4" : "0"}
					textStyle="sm"
					textDecoration="none"
					_hover={{ textDecoration: "underline" }}
					textUnderlineOffset="4px"
					onClick={secondaryAction.onClick}
				>
					{secondaryAction.label}
				</Button>
			)}
		</VStack>
	);

	if (variant === "page") {
		return (
			<Center minH="60vh" px="4" textAlign="center">
				{content}
			</Center>
		);
	}

	return (
		<VStack py="20" textAlign="center">
			{content}
		</VStack>
	);
}
