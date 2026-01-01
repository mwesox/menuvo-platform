import { useSuspenseQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	type ErrorComponentProps,
} from "@tanstack/react-router";
import { MapPin, Search, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StoreCard } from "@/features/shop/components/store-card";
import { StoreCardSkeletonGrid } from "@/features/shop/components/store-card-skeleton";
import { StoreSearch } from "@/features/shop/components/store-search";
import { useShop } from "@/features/shop/contexts/shop-context";
import { shopQueries } from "@/features/shop/queries";

export const Route = createFileRoute("/shop/")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(shopQueries.stores());
	},
	component: ShopDiscoveryPage,
	pendingComponent: DiscoveryPageLoading,
	errorComponent: ShopDiscoveryError,
});

function ShopDiscoveryPage() {
	const { data: stores } = useSuspenseQuery(shopQueries.stores());
	const { setStoreName } = useShop();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCity, setSelectedCity] = useState("all");

	// Clear store name when on discovery page
	useEffect(() => {
		setStoreName(null);
	}, [setStoreName]);

	// Extract unique cities for filter pills
	const cities = useMemo(() => {
		const uniqueCities = [
			...new Set(
				stores.map((s) => s.city).filter((c): c is string => Boolean(c)),
			),
		];
		return uniqueCities.sort();
	}, [stores]);

	// Filter stores based on search and city
	const filteredStores = useMemo(() => {
		return stores.filter((store) => {
			// City filter
			if (selectedCity !== "all" && store.city !== selectedCity) {
				return false;
			}

			// Search filter
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase();
				const matchesName = store.name.toLowerCase().includes(query);
				const matchesCity = store.city?.toLowerCase().includes(query);
				const matchesAddress = store.street?.toLowerCase().includes(query);
				return matchesName || matchesCity || matchesAddress;
			}

			return true;
		});
	}, [stores, selectedCity, searchQuery]);

	return (
		<div className="min-h-screen">
			{/* Hero section */}
			<div className="px-4 pb-4 pt-8">
				<h1
					style={{ fontFamily: "var(--font-heading)" }}
					className="text-4xl text-foreground"
				>
					Discover
				</h1>
				<p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
					<MapPin className="h-4 w-4" />
					Find restaurants near you
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
					<EmptyState
						hasFilters={searchQuery !== "" || selectedCity !== "all"}
						onClearFilters={() => {
							setSearchQuery("");
							setSelectedCity("all");
						}}
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

function EmptyState({
	hasFilters,
	onClearFilters,
}: {
	hasFilters: boolean;
	onClearFilters: () => void;
}) {
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
				{hasFilters ? "No restaurants found" : "No restaurants yet"}
			</h2>
			<p className="mt-1 max-w-sm text-muted-foreground">
				{hasFilters
					? "Try adjusting your filters or search term to find what you're looking for."
					: "Restaurants will appear here once they're added to the platform."}
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
					Clear filters
				</button>
			)}
		</div>
	);
}

function DiscoveryPageLoading() {
	return (
		<div className="min-h-screen">
			{/* Hero section */}
			<div className="px-4 pb-4 pt-8">
				<h1
					style={{ fontFamily: "var(--font-heading)" }}
					className="text-4xl text-foreground"
				>
					Discover
				</h1>
				<p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
					<MapPin className="h-4 w-4" />
					Find restaurants near you
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
					<span className="text-muted-foreground">Search restaurants...</span>
				</div>
			</div>

			{/* Store grid skeleton */}
			<div className="px-4 pb-8">
				<StoreCardSkeletonGrid />
			</div>
		</div>
	);
}

function ShopDiscoveryError({ reset }: ErrorComponentProps) {
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
				Something went wrong
			</h2>
			<p className="mt-1 max-w-sm text-muted-foreground">
				We couldn't load the restaurants. Please try again.
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
				Try again
			</button>
		</div>
	);
}
