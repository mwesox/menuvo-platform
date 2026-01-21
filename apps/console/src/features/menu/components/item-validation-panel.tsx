import { Alert, Card, HStack, VStack } from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/typography";
import type { ItemValidationResult } from "../validation.types";

interface ItemValidationPanelProps {
	validation: ItemValidationResult;
}

/**
 * Detailed panel showing all validation issues
 *
 * Displays issues with i18n messages.
 * Returns null when there are no issues.
 */
export function ItemValidationPanel({ validation }: ItemValidationPanelProps) {
	const { t } = useTranslation("menu");

	// All good - don't show panel
	if (!validation.hasIssues) {
		return null;
	}

	return (
		<Card.Root>
			<Card.Header pb="3">
				<Card.Title textStyle="base">{t("validation.title")}</Card.Title>
			</Card.Header>
			<Card.Body pt="0">
				<VStack gap="4" align="stretch">
					{/* Issues section */}
					<VStack gap="2" align="stretch">
						<HStack gap="2" alignItems="center">
							<AlertTriangle
								style={{ height: "1rem", width: "1rem" }}
								color="var(--chakra-colors-fg-warning)"
							/>
							<Label color="fg.warning">{t("validation.issuesTitle")}</Label>
						</HStack>
						<VStack gap="1.5" align="stretch">
							{validation.issues.map((issue) => (
								<Alert.Root key={issue.code} status="warning" py="2">
									<Alert.Indicator>
										<AlertTriangle
											style={{ height: "1rem", width: "1rem" }}
											color="var(--chakra-colors-fg-warning)"
										/>
									</Alert.Indicator>
									<Alert.Title>
										{t(`validation.codes.${issue.code}`, {
											defaultValue: issue.code,
										})}
									</Alert.Title>
								</Alert.Root>
							))}
						</VStack>
					</VStack>

					{/* Cannot publish message */}
					{!validation.isPublishable && (
						<Label color="fg.warning">
							{t("validation.cannotPublishWithIssues")}
						</Label>
					)}
				</VStack>
			</Card.Body>
		</Card.Root>
	);
}
