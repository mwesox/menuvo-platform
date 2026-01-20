import type { AppRouter } from "@menuvo/api/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import { createContext, useContext } from "react";

type RouterOutput = inferRouterOutputs<AppRouter>;
type StoreWithDetails = RouterOutput["store"]["getWithDetails"];

const StoreContext = createContext<StoreWithDetails | null>(null);

export function StoreProvider({
	store,
	children,
}: {
	store: StoreWithDetails;
	children: React.ReactNode;
}) {
	return (
		<StoreContext.Provider value={store}>{children}</StoreContext.Provider>
	);
}

/**
 * Hook to access the current store context.
 * Only use within store-scoped routes (under /stores/:storeId).
 * Never returns null - throws if used outside store context.
 */
export function useStore(): StoreWithDetails {
	const store = useContext(StoreContext);
	if (!store) {
		throw new Error("useStore must be used within a StoreProvider");
	}
	return store;
}

/**
 * Hook to access store context that may be null.
 * Use when you're unsure if you're within a store-scoped route.
 */
export function useStoreOptional(): StoreWithDetails | null {
	return useContext(StoreContext);
}
