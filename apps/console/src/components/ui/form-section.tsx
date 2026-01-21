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
 */
export function FormSection({
	title,
	description,
	children,
	variant = "card",
}: FormSectionProps) {
	return (
		<Fieldset.Root>
			<Stack gap="1" mb="3">
				<Fieldset.Legend fontWeight="semibold" textStyle="base">
					{title}
				</Fieldset.Legend>
				{description && (
					<Fieldset.HelperText color="fg.muted" textStyle="sm">
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
