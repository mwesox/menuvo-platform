import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuClock } from "react-icons/lu";
import { EmptyState } from "./ui";

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
	const navigate = useNavigate();

	return (
		<EmptyState
			variant="page"
			icon={LuClock}
			title={title ?? t("errors.storeTemporarilyUnavailable")}
			description={message ?? t("errors.storeUnavailableDescription")}
			action={
				backUrl
					? {
							label: backLabel ?? t("errors.backToMenu"),
							onClick: () => navigate({ to: backUrl }),
						}
					: undefined
			}
		/>
	);
}
