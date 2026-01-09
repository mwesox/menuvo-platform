import { Button } from "@menuvo/ui/components/button";
import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

type StoreUnavailableProps = {
	/** Custom title - defaults to i18n "errors.storeTemporarilyUnavailable" */
	title?: string;
	/** Custom message - defaults to i18n "errors.storeUnavailableDescription" */
	message?: string;
	/** URL for back button - if provided, shows a back button */
	backUrl?: string;
	/** Label for back button - defaults to i18n "errors.backToMenu" */
	backLabel?: string;
};

/**
 * Generic "store unavailable" component for the shop.
 *
 * Use cases:
 * - Payment unavailable
 * - Store closed
 * - Outside delivery area
 * - Maintenance mode
 */
export function StoreUnavailable({
	title,
	message,
	backUrl,
	backLabel,
}: StoreUnavailableProps) {
	const { t } = useTranslation("shop");

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
			<div
				className="mb-4 flex size-16 items-center justify-center rounded-full"
				style={{ backgroundColor: "var(--muted)" }}
			>
				<Clock className="size-8 text-muted-foreground" />
			</div>
			<h1
				className="text-2xl text-foreground"
				style={{ fontFamily: "var(--font-heading)" }}
			>
				{title ?? t("errors.storeTemporarilyUnavailable")}
			</h1>
			<p className="mt-2 max-w-sm text-muted-foreground">
				{message ?? t("errors.storeUnavailableDescription")}
			</p>
			{backUrl && (
				<Button asChild variant="outline" className="mt-6">
					<Link to={backUrl}>{backLabel ?? t("errors.backToMenu")}</Link>
				</Button>
			)}
		</div>
	);
}
