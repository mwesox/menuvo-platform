import { useTranslation } from "react-i18next";
import { LuUtensilsCrossed } from "react-icons/lu";
import { EmptyState } from "../../shared/components/ui";

export function EmptyMenuState() {
	const { t } = useTranslation("shop");

	return (
		<EmptyState
			variant="inline"
			icon={LuUtensilsCrossed}
			title={t("menu.emptyTitle")}
			description={t("menu.emptyDescription")}
		/>
	);
}
