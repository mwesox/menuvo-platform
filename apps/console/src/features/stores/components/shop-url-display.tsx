import { Button, Input, Label } from "@menuvo/ui";
import {
	AlertTriangle,
	Check,
	Copy,
	ExternalLink,
	Loader2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface ShopUrlDisplayProps {
	/** The slug to display */
	slug: string;
	/** Whether the availability check is in progress */
	isChecking?: boolean;
	/** Whether the slug is available (null = not yet checked) */
	isAvailable?: boolean | null;
	/** First available alternative slug if the primary is taken */
	nextAvailable?: string | null;
}

/**
 * Displays the shop URL with availability status.
 *
 * Modes:
 * - Static: Just shows the URL (when isAvailable is undefined)
 * - Interactive: Shows availability indicator and suggestions
 */
export function ShopUrlDisplay({
	slug,
	isChecking,
	isAvailable,
	nextAvailable,
}: ShopUrlDisplayProps) {
	const { t } = useTranslation("stores");
	const [copied, setCopied] = useState(false);

	// Determine which slug to display based on availability
	const displaySlug =
		isAvailable === false && nextAvailable ? nextAvailable : slug;
	const shopUrl = `https://www.menuvo.app/${displaySlug}`;

	// Show interactive mode when availability is being tracked
	const isInteractive = isAvailable !== undefined;
	// Slug will change on save (showing alternative)
	const willUseAlternative = isAvailable === false && nextAvailable;

	const handleCopy = async () => {
		await navigator.clipboard.writeText(shopUrl);
		setCopied(true);
		toast.success(t("toast.urlCopied"));
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="space-y-3 rounded-lg border p-4">
			<div className="space-y-0.5">
				<Label>{t("labels.shopUrl")}</Label>
				<p className="text-muted-foreground text-sm">
					{t("descriptions.shopUrl")}
				</p>
			</div>

			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<Input value={shopUrl} readOnly className="pr-10" />
					{isInteractive && (
						<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
							{isChecking ? (
								<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
							) : isAvailable ? (
								<Check className="h-4 w-4 text-green-500" />
							) : (
								<AlertTriangle className="h-4 w-4 text-amber-500" />
							)}
						</div>
					)}
				</div>
				<Button
					variant="outline"
					size="icon"
					onClick={handleCopy}
					title={t("actions.copyUrl")}
				>
					{copied ? (
						<Check className="h-4 w-4 text-green-500" />
					) : (
						<Copy className="h-4 w-4" />
					)}
				</Button>
				<Button variant="outline" size="icon" asChild>
					<a
						href={shopUrl}
						target="_blank"
						rel="noopener noreferrer"
						title={t("actions.openShop")}
					>
						<ExternalLink className="h-4 w-4" />
					</a>
				</Button>
			</div>

			{/* Show message when using alternative slug */}
			{willUseAlternative && (
				<p className="text-sm text-amber-600">
					{t("slugTaken", {
						original: slug,
						alternative: nextAvailable,
						defaultValue: `"${slug}" is taken. Will be saved as "${nextAvailable}".`,
					})}
				</p>
			)}
		</div>
	);
}
