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
			<div
				className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
				style={{ backgroundColor: "var(--muted)" }}
			>
				<Store className="h-8 w-8 text-muted-foreground" />
			</div>
			<h2
				className="text-xl text-foreground"
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
					className="mt-4 rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
					style={{
						backgroundColor: "var(--primary)",
						color: "var(--primary-foreground)",
					}}
				>
					{t("emptyState.noResults.clearFilters")}
				</button>
			)}
		</div>
	);
}
