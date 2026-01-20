import type { AppRouter } from "@menuvo/api/trpc";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { useTRPC } from "@/lib/trpc";

type RouterOutput = inferRouterOutputs<AppRouter>;
type StoreList = RouterOutput["store"]["list"];

type StoreSelectionContextValue = {
	stores: StoreList;
	isLoading: boolean;
	selectedStoreId: string | undefined;
	selectStore: (storeId: string) => void;
};

const StoreSelectionContext = createContext<StoreSelectionContextValue | null>(
	null,
);

export function StoreSelectionProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const params = useParams({ strict: false }) as { storeId?: string };
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;
	const navigate = useNavigate();
	const trpc = useTRPC();

	// State to remember store selection when navigating away from store routes
	const [rememberedStoreId, setRememberedStoreId] = useState<string | null>(
		null,
	);

	const { data: storesData, isLoading } = useQuery(
		trpc.store.list.queryOptions(),
	);
	const stores = (storesData ?? []) as StoreList;

	// Sync remembered store from route params when on store pages
	useEffect(() => {
		if (params.storeId) {
			setRememberedStoreId(params.storeId);
		}
	}, [params.storeId]);

	// Auto-select first store if none remembered and stores are loaded
	useEffect(() => {
		const firstStore = stores[0];
		if (!rememberedStoreId && firstStore) {
			setRememberedStoreId(firstStore.id);
		}
	}, [rememberedStoreId, stores]);

	// Priority: route param → remembered → first store
	const selectedStoreId = params.storeId ?? rememberedStoreId ?? stores[0]?.id;

	// Store selection - navigate if on store route, otherwise just update state
	const selectStore = useCallback(
		(storeId: string) => {
			setRememberedStoreId(storeId);

			// If currently on a store route, navigate to the same section with new store
			if (params.storeId && params.storeId !== storeId) {
				// Extract the section from current path: /stores/{id}/menu → menu
				const match = currentPath.match(/^\/stores\/[^/]+\/(\w+)/);
				if (match) {
					const section = match[1];
					navigate({
						to: `/stores/$storeId/${section}` as "/stores/$storeId/menu",
						params: { storeId },
					});
				}
			}
		},
		[params.storeId, currentPath, navigate],
	);

	return (
		<StoreSelectionContext.Provider
			value={{ stores, isLoading, selectedStoreId, selectStore }}
		>
			{children}
		</StoreSelectionContext.Provider>
	);
}

export function useStoreSelection(): StoreSelectionContextValue {
	const ctx = useContext(StoreSelectionContext);
	if (!ctx) {
		throw new Error(
			"useStoreSelection must be used within a StoreSelectionProvider",
		);
	}
	return ctx;
}
