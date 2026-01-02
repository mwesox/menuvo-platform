import { useSuspenseQuery } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { MapPin, Search, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { shopQueries } from "../../queries";
import { useStoreDiscovery } from "../hooks/use-store-discovery";
import { DiscoveryEmptyState } from "./discovery-empty-state";
import { StoreCard } from "./store-card";
import { StoreCardSkeletonGrid } from "./store-card-skeleton";
import { StoreSearch } from "./store-search";

export function DiscoveryPage() {
	const { t } = useTranslation("discovery");
	const { data: stores } = useSuspenseQuery(shopQueries.stores());

	const {
		cities,
		filteredStores,
		searchQuery,
		setSearchQuery,
		selectedCity,
		setSelectedCity,
		clearFilters,
		hasActiveFilters,
	} = useStoreDiscovery({ stores });

	return (
		<div className="min-h-screen">
			{/* Hero section */}
			<div className="px-4 pb-4 pt-8">
				<h1
					style={{ fontFamily: "var(--font-heading)" }}
					className="text-4xl text-foreground"
				>
					{t("page.title")}
				</h1>
				<p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
					<MapPin className="h-4 w-4" />
					{t("page.subtitle")}
				</p>
			</div>

			{/* Search and filters */}
			<div className="sticky top-14 z-30 bg-background px-4 pb-4 pt-2">
				<StoreSearch
					cities={cities}
					selectedCity={selectedCity}
					searchQuery={searchQuery}
					onCityChange={setSelectedCity}
					onSearchChange={setSearchQuery}
				/>
			</div>

			{/* Store grid */}
			<div className="px-4 pb-8">
				{filteredStores.length === 0 ? (
					<DiscoveryEmptyState
						hasFilters={hasActiveFilters}
						onClearFilters={clearFilters}
					/>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filteredStores.map((store) => (
							<StoreCard key={store.id} store={store} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export function DiscoveryPageSkeleton() {
	const { t } = useTranslation("discovery");

	return (
		<div className="min-h-screen">
			{/* Hero section */}
			<div className="px-4 pb-4 pt-8">
				<h1
					style={{ fontFamily: "var(--font-heading)" }}
					className="text-4xl text-foreground"
				>
					{t("page.title")}
				</h1>
				<p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
					<MapPin className="h-4 w-4" />
					{t("page.subtitle")}
				</p>
			</div>

			{/* Search and filters placeholder */}
			<div className="sticky top-14 z-30 bg-background px-4 pb-4 pt-2">
				<div
					className="flex items-center gap-2 rounded-full px-4 py-2.5"
					style={{
						backgroundColor: "var(--card)",
						boxShadow:
							"0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
					}}
				>
					<Search className="h-5 w-5 text-muted-foreground" />
					<span className="text-muted-foreground">
						{t("loading.searchPlaceholder")}
					</span>
				</div>
			</div>

			{/* Store grid skeleton */}
			<div className="px-4 pb-8">
				<StoreCardSkeletonGrid />
			</div>
		</div>
	);
}

export function DiscoveryPageError({ reset }: ErrorComponentProps) {
	const { t } = useTranslation("discovery");

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
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
				{t("error.title")}
			</h2>
			<p className="mt-1 max-w-sm text-muted-foreground">
				{t("error.description")}
			</p>
			<button
				type="button"
				onClick={reset}
				className="mt-4 rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
				style={{
					backgroundColor: "var(--primary)",
					color: "var(--primary-foreground)",
				}}
			>
				{t("error.tryAgain")}
			</button>
		</div>
	);
}
