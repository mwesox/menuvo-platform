import { useTranslation } from "react-i18next";
import { LuUtensilsCrossed } from "react-icons/lu";
import { EmptyState } from "./ui";

export function StoreNotFound() {
	const { t } = useTranslation("shop");

	return (
		<EmptyState
			variant="page"
			icon={LuUtensilsCrossed}
			title={t("errors.restaurantNotFound")}
			description={t("errors.restaurantNotFoundDescription")}
		/>
	);
}
