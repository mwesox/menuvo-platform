import { Card, Fieldset, Stack } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface FormSectionProps {
	/** Section title - displayed as fieldset legend */
	title: string;
	/** Optional description below the title */
	description?: string;
	/** Content of the section */
	children: ReactNode;
	/**
	 * Variant for content container:
	 * - "card": Content wrapped in a bordered card (for form inputs)
	 * - "plain": No wrapper, just the children (for toggle rows)
	 */
	variant?: "card" | "plain";
}

/**
 * Form section using Chakra UI Fieldset.
 * Provides semantic HTML <fieldset> element with consistent styling.
 *
 * Spacing:
 * - Title and description grouped tightly (gap="0.5")
 * - Minimal gap (mb="1" = 4px) between header and card - they belong together
 * - Parent provides larger gap between sections (gap="8" = 32px)
 */
export function FormSection({
	title,
	description,
	children,
	variant = "card",
}: FormSectionProps) {
	return (
		<Fieldset.Root>
			<Stack gap="0.5" mb="1.5">
				<Fieldset.Legend as="h2" textStyle="sectionTitle">
					{title}
				</Fieldset.Legend>
				{description && (
					<Fieldset.HelperText textStyle="caption">
						{description}
					</Fieldset.HelperText>
				)}
			</Stack>

			{variant === "card" ? (
				<Card.Root variant="outline">
					<Card.Body>
						<Fieldset.Content>{children}</Fieldset.Content>
					</Card.Body>
				</Card.Root>
			) : (
				<Fieldset.Content>{children}</Fieldset.Content>
			)}
		</Fieldset.Root>
	);
}
