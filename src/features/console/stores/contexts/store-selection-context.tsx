import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import { storeQueries } from "../queries";

interface StoreSelectionContextValue {
	stores: Array<{ id: number; name: string; isActive: boolean }>;
	selectedStoreId: number | undefined;
	selectedStore: { id: number; name: string; isActive: boolean } | undefined;
	selectStore: (storeId: number) => void;
	hasMultipleStores: boolean;
}

export function useStoreSelection(): StoreSelectionContextValue {
	const navigate = useNavigate();
	const search = useSearch({ strict: false }) as { storeId?: number };
	const { data: stores } = useSuspenseQuery(storeQueries.list());

	// Auto-select first store if only one exists
	const effectiveStoreId =
		search.storeId ?? (stores.length === 1 ? stores[0].id : undefined);

	const selectedStore = stores.find((s) => s.id === effectiveStoreId);

	const selectStore = useCallback((storeId: number) => {
		// Navigate to menu page with the selected store
		// This is the primary use case for store selection
		navigate({
			to: "/console/menu",
			search: { storeId },
		});
	}, [navigate]);

	return {
		stores,
		selectedStoreId: effectiveStoreId,
		selectedStore,
		selectStore,
		hasMultipleStores: stores.length > 1,
	};
}
