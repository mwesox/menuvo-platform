import { useDeferredValue, useMemo, useState } from "react";

interface Store {
	id: number;
	name: string;
	slug: string;
	street: string | null;
	city: string | null;
	imageUrl?: string | null;
	isOpen: boolean;
}

interface UseStoreDiscoveryOptions {
	stores: Store[];
}

interface UseStoreDiscoveryResult {
	cities: string[];
	filteredStores: Store[];
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	selectedCity: string;
	setSelectedCity: (city: string) => void;
	clearFilters: () => void;
	hasActiveFilters: boolean;
}

/**
 * Hook for managing store discovery filtering and search.
 * Uses useDeferredValue for smooth search performance.
 */
export function useStoreDiscovery({
	stores,
}: UseStoreDiscoveryOptions): UseStoreDiscoveryResult {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCity, setSelectedCity] = useState("all");

	// Defer the search query for better performance
	const deferredSearchQuery = useDeferredValue(searchQuery);

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
			if (deferredSearchQuery.trim()) {
				const query = deferredSearchQuery.toLowerCase();
				const matchesName = store.name.toLowerCase().includes(query);
				const matchesCity = store.city?.toLowerCase().includes(query);
				const matchesAddress = store.street?.toLowerCase().includes(query);
				return matchesName || matchesCity || matchesAddress;
			}

			return true;
		});
	}, [stores, selectedCity, deferredSearchQuery]);

	const clearFilters = () => {
		setSearchQuery("");
		setSelectedCity("all");
	};

	const hasActiveFilters = searchQuery !== "" || selectedCity !== "all";

	return {
		cities,
		filteredStores,
		searchQuery,
		setSearchQuery,
		selectedCity,
		setSelectedCity,
		clearFilters,
		hasActiveFilters,
	};
}
