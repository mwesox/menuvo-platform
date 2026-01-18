import type { AppRouter } from "@menuvo/api/trpc";
import { useQuery } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { Search, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTRPC } from "../../../lib/trpc";
import { useStoreDiscovery } from "../hooks/use-store-discovery";
import { DiscoveryEmptyState } from "./discovery-empty-state";
import { StoreCard } from "./store-card";
import { StoreCardSkeletonGrid } from "./store-card-skeleton";
import { StoreSearch } from "./store-search";

type RouterOutput = inferRouterOutputs<AppRouter>;
type FeaturedStores = RouterOutput["store"]["getFeaturedStores"];

export function DiscoveryPage() {
	const { t } = useTranslation("discovery");
	const trpc = useTRPC();
	const { data } = useQuery({
		...trpc.store.getFeaturedStores.queryOptions({ limit: 20 }),
		staleTime: 1000 * 60 * 5,
	});

	// Type assertion - the API returns stores matching the hook's expected shape
	const stores: FeaturedStores = (data ?? []) as FeaturedStores;

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
			<div className="px-4 pt-12 sm:px-6 sm:pt-14 lg:px-8">
				<div className="mx-auto max-w-3xl text-center">
					{/* Brand logo */}
					<div className="fade-in zoom-in-95 mb-4 flex animate-in justify-center fill-mode-both duration-500 sm:mb-5">
						<img
							src="/menuvo-logo-horizontal.svg"
							alt="Menuvo"
							className="h-10 sm:h-11"
						/>
					</div>

					{/* Main headline */}
					<h1
						className="fade-in slide-in-from-bottom-2 animate-in fill-mode-both font-semibold text-2xl text-foreground leading-[1.15] tracking-tight delay-100 duration-500 sm:text-3xl"
						style={{ textWrap: "balance" }}
					>
						{t("page.title")}
					</h1>

					{/* Search */}
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

			{/* Store grid */}
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
			{/* Hero section */}
			<div className="px-4 pt-12 sm:px-6 sm:pt-14 lg:px-8">
				<div className="mx-auto max-w-3xl text-center">
					{/* Brand logo */}
					<div className="mb-4 flex justify-center sm:mb-5">
						<img
							src="/menuvo-logo-horizontal.svg"
							alt="Menuvo"
							className="h-10 sm:h-11"
						/>
					</div>

					<h1
						className="font-semibold text-2xl text-foreground leading-[1.15] tracking-tight sm:text-3xl"
						style={{ textWrap: "balance" }}
					>
						{t("page.title")}
					</h1>

					{/* Search placeholder */}
					<div className="mt-4 space-y-4 sm:mt-5">
						<div className="flex h-14 items-center gap-3 rounded-xl bg-card px-5 shadow-foreground/[0.03] shadow-lg ring-1 ring-border/50">
							<Search className="size-5 text-muted-foreground/60" />
							<span className="text-muted-foreground/50">
								{t("loading.searchPlaceholder")}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Store grid skeleton */}
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
			<h2 className="font-semibold text-foreground text-xl">
				{t("error.title")}
			</h2>
			<p className="mt-1 max-w-sm text-muted-foreground">
				{t("error.description")}
			</p>
			<button
				type="button"
				onClick={reset}
				className="mt-4 rounded-lg bg-foreground px-5 py-2.5 font-medium text-background text-sm transition-colors hover:bg-foreground/90"
			>
				{t("error.tryAgain")}
			</button>
		</div>
	);
}
