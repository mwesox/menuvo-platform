import { EmptyState, VStack } from "@chakra-ui/react";
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
		<EmptyState.Root>
			<EmptyState.Content>
				<EmptyState.Indicator>
					<Icon />
				</EmptyState.Indicator>
				<VStack textAlign="center">
					<EmptyState.Title>{t("storeSelection.required")}</EmptyState.Title>
					<EmptyState.Description>
						{t("storeSelection.useHeaderSelector")}
					</EmptyState.Description>
				</VStack>
			</EmptyState.Content>
		</EmptyState.Root>
	);
}
