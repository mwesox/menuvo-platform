import { Badge, Tooltip, TooltipContent, TooltipTrigger } from "@menuvo/ui";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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
			<div className="flex items-center gap-1.5 text-green-600">
				<CheckCircle2 className="h-4 w-4" />
				<span className="text-xs">{t("validation.allGood")}</span>
			</div>
		);
	}

	// Build tooltip content
	const tooltipText = `${issueCount} ${issueCount === 1 ? t("validation.issue") : t("validation.issues")}`;

	// Issues present
	const content = compact ? (
		<AlertTriangle className="h-4 w-4 text-amber-500" />
	) : (
		<Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
			<AlertTriangle className="h-3 w-3" />
			{issueCount}
		</Badge>
	);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-flex cursor-help">{content}</span>
			</TooltipTrigger>
			<TooltipContent>
				<div className="text-xs">
					<div>{tooltipText}</div>
					<div className="mt-1 text-muted-foreground">
						{t("validation.cannotPublishWithIssues")}
					</div>
				</div>
			</TooltipContent>
		</Tooltip>
	);
}
