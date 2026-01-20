import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@menuvo/ui";
import type { LucideIcon } from "lucide-react";
import { Store } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StoreSelectionRequiredProps {
	icon?: LucideIcon;
}

export function StoreSelectionRequired({
	icon: Icon = Store,
}: StoreSelectionRequiredProps) {
	const { t } = useTranslation("common");

	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Icon />
				</EmptyMedia>
				<EmptyTitle>{t("storeSelection.required")}</EmptyTitle>
				<EmptyDescription>
					{t("storeSelection.useHeaderSelector")}
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}
