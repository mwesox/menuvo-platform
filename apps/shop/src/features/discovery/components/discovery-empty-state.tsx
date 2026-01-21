import { useTranslation } from "react-i18next";
import { LuStore } from "react-icons/lu";
import { EmptyState } from "../../shared/components/ui";

interface DiscoveryEmptyStateProps {
	hasFilters: boolean;
	onClearFilters: () => void;
}

export function DiscoveryEmptyState({
	hasFilters,
	onClearFilters,
}: DiscoveryEmptyStateProps) {
	const { t } = useTranslation("discovery");

	return (
		<EmptyState
			variant="inline"
			icon={LuStore}
			title={
				hasFilters
					? t("emptyState.noResults.title")
					: t("emptyState.noStores.title")
			}
			description={
				hasFilters
					? t("emptyState.noResults.description")
					: t("emptyState.noStores.description")
			}
			action={
				hasFilters
					? {
							label: t("emptyState.noResults.clearFilters"),
							onClick: onClearFilters,
						}
					: undefined
			}
		/>
	);
}
