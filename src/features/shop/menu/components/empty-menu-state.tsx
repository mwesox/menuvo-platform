import { UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EmptyMenuState() {
	const { t } = useTranslation("shop");

	return (
		<div className="flex flex-col items-center justify-center py-20 text-center">
			<div
				className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
				style={{ backgroundColor: "var(--muted)" }}
			>
				<UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
			</div>
			<h2
				className="text-xl text-foreground"
				style={{ fontFamily: "var(--font-heading)" }}
			>
				{t("menu.emptyTitle")}
			</h2>
			<p className="mt-1 max-w-sm text-muted-foreground">
				{t("menu.emptyDescription")}
			</p>
		</div>
	);
}
