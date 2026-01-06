import { Store } from "lucide-react";
import { useTranslation } from "react-i18next";

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
		<div className="flex flex-col items-center justify-center py-20 text-center">
			<div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
				<Store className="size-8 text-muted-foreground" />
			</div>
			<h2
				className="text-foreground text-xl"
				style={{ fontFamily: "var(--font-heading)" }}
			>
				{hasFilters
					? t("emptyState.noResults.title")
					: t("emptyState.noStores.title")}
			</h2>
			<p className="mt-1 max-w-sm text-muted-foreground">
				{hasFilters
					? t("emptyState.noResults.description")
					: t("emptyState.noStores.description")}
			</p>
			{hasFilters && (
				<button
					type="button"
					onClick={onClearFilters}
					className="mt-4 rounded-full bg-foreground px-5 py-2.5 font-medium text-background text-sm transition-colors hover:bg-foreground/90"
				>
					{t("emptyState.noResults.clearFilters")}
				</button>
			)}
		</div>
	);
}
