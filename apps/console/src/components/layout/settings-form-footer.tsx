import { Box, Button, HStack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

interface SettingsFormFooterProps {
	/** Whether the form is currently submitting */
	isSubmitting: boolean;
	/** Optional cancel handler - if provided, shows a cancel button */
	onCancel?: () => void;
	/** Optional custom submit button text */
	submitText?: string;
	/** Optional custom submitting text */
	submittingText?: string;
}

/**
 * Consistent footer for settings forms.
 * Uses borderTop instead of separator for connected visual appearance.
 */
export function SettingsFormFooter({
	isSubmitting,
	onCancel,
	submitText,
	submittingText,
}: SettingsFormFooterProps) {
	const { t } = useTranslation("common");

	return (
		<Box pt="6" borderTopWidth="1px" mt="auto">
			<HStack justify="flex-end" gap="3">
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						{t("buttons.cancel")}
					</Button>
				)}
				<Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
					{isSubmitting
						? (submittingText ?? t("states.saving"))
						: (submitText ?? t("buttons.saveChanges"))}
				</Button>
			</HStack>
		</Box>
	);
}
