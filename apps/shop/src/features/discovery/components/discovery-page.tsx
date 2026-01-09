import { useSuspenseQuery } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Search, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { shopQueries } from "../../queries";
import { useStoreDiscovery } from "../hooks/use-store-discovery";
import { DiscoveryEmptyState } from "./discovery-empty-state";
import { StoreCard } from "./store-card";
import { StoreCardSkeletonGrid } from "./store-card-skeleton";
import { StoreSearch } from "./store-search";

/** Floating orbs that gently drift */
function HeroOrbs() {
	return (
		<div className="hero-bubbles" aria-hidden="true">
			<div className="hero-bubble hero-bubble-1" />
			<div className="hero-bubble hero-bubble-2" />
			<div className="hero-bubble hero-bubble-3" />
			<div className="hero-bubble hero-bubble-4" />
			<div className="hero-bubble hero-bubble-5" />
			<div className="hero-bubble hero-bubble-6" />
		</div>
	);
}

export function DiscoveryPage() {
	const { t } = useTranslation("discovery");
	const { data } = useSuspenseQuery(shopQueries.featuredStores(20));

	// Type assertion - the API returns stores matching the hook's expected shape
	const stores = data ?? [];

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
			{/* Compact hero with floating orbs */}
			<div className="relative overflow-hidden">
				{/* Floating orbs */}
				<HeroOrbs />

				{/* Hero content - compact, utility-focused */}
				<div className="relative z-10 px-4 pt-12 sm:px-6 sm:pt-14 lg:px-8">
					<div className="mx-auto max-w-3xl text-center">
						{/* Brand logo - compact */}
						<div className="fade-in zoom-in-95 mb-4 flex animate-in justify-center fill-mode-both duration-500 sm:mb-5">
							<img
								src="/menuvo-logo-horizontal.svg"
								alt="Menuvo"
								className="h-10 sm:h-11"
							/>
						</div>

						{/* Main headline - compact */}
						<h1
							className="fade-in slide-in-from-bottom-2 animate-in fill-mode-both text-2xl text-foreground leading-[1.15] tracking-tight delay-100 duration-500 sm:text-3xl"
							style={{
								fontFamily: "var(--font-heading)",
								textWrap: "balance",
							}}
						>
							{t("page.title")}
						</h1>

						{/* Search - primary action */}
						<div className="fade-in slide-in-from-bottom-2 mt-4 animate-in fill-mode-both delay-200 duration-500 sm:mt-5">
							<StoreSearch
								cities={cities}
								selectedCity={selectedCity}
								searchQuery={searchQuery}
								onCityChange={setSelectedCity}
								onSearchChange={setSearchQuery}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Store grid - close to hero */}
			<div className="px-4 pt-5 pb-16 sm:px-6 sm:pt-6 lg:px-8">
				<div className="mx-auto max-w-6xl">
					{filteredStores.length === 0 ? (
						<DiscoveryEmptyState
							hasFilters={hasActiveFilters}
							onClearFilters={clearFilters}
						/>
					) : (
						<div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
							{filteredStores.map((store, index) => (
								<StoreCard
									key={store.id}
									store={store}
									style={{ animationDelay: `${index * 60}ms` }}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export function DiscoveryPageSkeleton() {
	const { t } = useTranslation("discovery");

	return (
		<div className="min-h-screen">
			{/* Compact hero with floating orbs */}
			<div className="relative overflow-hidden">
				{/* Floating orbs */}
				<HeroOrbs />

				{/* Hero content - compact, utility-focused */}
				<div className="relative z-10 px-4 pt-12 sm:px-6 sm:pt-14 lg:px-8">
					<div className="mx-auto max-w-3xl text-center">
						{/* Brand logo - compact */}
						<div className="mb-4 flex justify-center sm:mb-5">
							<img
								src="/menuvo-logo-horizontal.svg"
								alt="Menuvo"
								className="h-10 sm:h-11"
							/>
						</div>

						<h1
							className="text-2xl text-foreground leading-[1.15] tracking-tight sm:text-3xl"
							style={{
								fontFamily: "var(--font-heading)",
								textWrap: "balance",
							}}
						>
							{t("page.title")}
						</h1>

						{/* Search placeholder */}
						<div className="mt-4 space-y-4 sm:mt-5">
							<div className="flex h-14 items-center gap-3 rounded-2xl bg-card px-5 shadow-foreground/[0.03] shadow-lg ring-1 ring-border/50">
								<Search className="size-5 text-muted-foreground/60" />
								<span className="text-muted-foreground/50">
									{t("loading.searchPlaceholder")}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Store grid skeleton - close to hero */}
			<div className="px-4 pt-5 pb-16 sm:px-6 sm:pt-6 lg:px-8">
				<div className="mx-auto max-w-6xl">
					<StoreCardSkeletonGrid />
				</div>
			</div>
		</div>
	);
}

export function DiscoveryPageError({ reset }: ErrorComponentProps) {
	const { t } = useTranslation("discovery");

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
			<div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
				<Store className="size-8 text-muted-foreground" />
			</div>
			<h2
				className="text-foreground text-xl"
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
				className="mt-4 rounded-full bg-foreground px-5 py-2.5 font-medium text-background text-sm transition-colors hover:bg-foreground/90"
			>
				{t("error.tryAgain")}
			</button>
		</div>
	);
}
