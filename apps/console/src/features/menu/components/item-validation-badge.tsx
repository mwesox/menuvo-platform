import { Badge, Box } from "@chakra-ui/react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/ui/tooltip";
import type { ItemValidationResult } from "../validation.types";

interface ItemValidationBadgeProps {
	validation: ItemValidationResult;
	/** Show compact mode (just icon) vs full mode (badge with count) */
	compact?: boolean;
}

/**
 * Compact badge showing item validation status
 *
 * - Amber AlertTriangle for issues (blocks publishing)
 * - Nothing/green check if no issues
 */
export function ItemValidationBadge({
	validation,
	compact = true,
}: ItemValidationBadgeProps) {
	const { t } = useTranslation("menu");

	const issueCount = validation.issues.length;

	// No issues - show nothing in compact mode
	if (!validation.hasIssues) {
		if (compact) {
			return null;
		}
		return (
			<Box display="flex" alignItems="center" gap="1.5" color="fg.success">
				<CheckCircle2 style={{ height: "1rem", width: "1rem" }} />
				<Box textStyle="xs">{t("validation.allGood")}</Box>
			</Box>
		);
	}

	// Build tooltip content
	const tooltipText = `${issueCount} ${issueCount === 1 ? t("validation.issue") : t("validation.issues")}`;

	// Issues present
	const content = compact ? (
		<AlertTriangle
			style={{ height: "1rem", width: "1rem" }}
			color="var(--chakra-colors-fg-warning)"
		/>
	) : (
		<Badge
			variant="outline"
			borderColor="border.warning"
			color="fg.warning"
			gap="1"
		>
			<AlertTriangle style={{ height: "0.75rem", width: "0.75rem" }} />
			{issueCount}
		</Badge>
	);

	return (
		<Tooltip
			content={
				<Box>
					<Box textStyle="xs">{tooltipText}</Box>
					<Box mt="1" color="fg.muted" textStyle="xs">
						{t("validation.cannotPublishWithIssues")}
					</Box>
				</Box>
			}
		>
			<Box display="inline-flex" cursor="help">
				{content}
			</Box>
		</Tooltip>
	);
}
