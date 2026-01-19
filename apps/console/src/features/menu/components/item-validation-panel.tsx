import {
	Alert,
	AlertDescription,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@menuvo/ui";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
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
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base">{t("validation.title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4 pt-0">
				{/* Issues section */}
				<div className="space-y-2">
					<h4 className="flex items-center gap-2 font-medium text-amber-600 text-sm dark:text-amber-500">
						<AlertTriangle className="h-4 w-4" />
						{t("validation.issuesTitle")}
					</h4>
					<ul className="space-y-1.5">
						{validation.issues.map((issue) => (
							<li key={issue.code} className="text-muted-foreground text-sm">
								<Alert className="border-amber-200 bg-amber-50 py-2 dark:border-amber-900 dark:bg-amber-950/20">
									<AlertTriangle className="h-4 w-4 text-amber-600" />
									<AlertDescription className="text-amber-700 dark:text-amber-400">
										{t(`validation.codes.${issue.code}`, {
											defaultValue: issue.code,
										})}
									</AlertDescription>
								</Alert>
							</li>
						))}
					</ul>
				</div>

				{/* Cannot publish message */}
				{!validation.isPublishable && (
					<p className="font-medium text-amber-600 text-sm">
						{t("validation.cannotPublishWithIssues")}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
