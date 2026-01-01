import { UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";

export function StoreNotFound() {
	const { t } = useTranslation("shop");

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
			<div
				className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
				style={{ backgroundColor: "var(--muted)" }}
			>
				<UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
			</div>
			<h1
				className="text-2xl text-foreground"
				style={{ fontFamily: "var(--font-heading)" }}
			>
				{t("errors.restaurantNotFound")}
			</h1>
			<p className="mt-2 max-w-sm text-muted-foreground">
				{t("errors.restaurantNotFoundDescription")}
			</p>
		</div>
	);
}
