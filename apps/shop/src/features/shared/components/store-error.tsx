import type { ErrorComponentProps } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuUtensilsCrossed } from "react-icons/lu";
import { EmptyState } from "./ui";

export function StoreError({ reset }: ErrorComponentProps) {
	const { t } = useTranslation("shop");

	return (
		<EmptyState
			variant="page"
			icon={LuUtensilsCrossed}
			title={t("errors.somethingWentWrong")}
			description={t("errors.couldNotLoadRestaurant")}
			secondaryAction={{
				label: t("errors.tryAgain"),
				onClick: reset,
			}}
		/>
	);
}
