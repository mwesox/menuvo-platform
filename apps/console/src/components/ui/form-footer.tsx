import { Button, HStack } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface FormFooterProps {
	/** Handler for cancel action */
	onCancel?: () => void;
	/** Cancel button label */
	cancelLabel?: string;
	/** Primary action - usually a submit button */
	primaryAction?: ReactNode;
	/** Whether the primary action is loading */
	isLoading?: boolean;
	/** Primary button label */
	primaryLabel?: string;
	/** Loading label for primary button */
	loadingLabel?: string;
	/** Form submit handler - if provided, renders a LoadingButton with type="submit" */
	onSubmit?: () => void;
}

/**
 * Footer with cancel and primary action buttons.
 * Can work as standalone buttons or as part of a form.
 */
export function FormFooter({
	onCancel,
	cancelLabel = "Cancel",
	primaryAction,
	isLoading = false,
	primaryLabel = "Save changes",
	loadingLabel = "Saving...",
	onSubmit,
}: FormFooterProps) {
	return (
		<HStack gap="3" justify="flex-end">
			{onCancel && (
				<Button type="button" variant="outline" onClick={onCancel}>
					{cancelLabel}
				</Button>
			)}

			{primaryAction ? (
				primaryAction
			) : (
				<Button
					type={onSubmit ? "button" : "submit"}
					onClick={onSubmit}
					loading={isLoading}
					loadingText={loadingLabel}
				>
					{primaryLabel}
				</Button>
			)}
		</HStack>
	);
}
