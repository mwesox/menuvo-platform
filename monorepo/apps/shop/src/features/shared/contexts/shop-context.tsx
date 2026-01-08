import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";

interface ShopContextValue {
	// Cart drawer
	isCartDrawerOpen: boolean;
	openCartDrawer: () => void;
	closeCartDrawer: () => void;

	// Menu search
	searchQuery: string;
	setSearchQuery: (query: string) => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

interface ShopProviderProps {
	children: ReactNode;
}

export function ShopProvider({ children }: ShopProviderProps) {
	// Cart drawer
	const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

	// Menu search
	const [searchQuery, setSearchQueryState] = useState("");

	const openCartDrawer = useCallback(() => {
		setIsCartDrawerOpen(true);
	}, []);

	const closeCartDrawer = useCallback(() => {
		setIsCartDrawerOpen(false);
	}, []);

	const setSearchQuery = useCallback((query: string) => {
		setSearchQueryState(query);
	}, []);

	return (
		<ShopContext.Provider
			value={{
				isCartDrawerOpen,
				openCartDrawer,
				closeCartDrawer,
				searchQuery,
				setSearchQuery,
			}}
		>
			{children}
		</ShopContext.Provider>
	);
}

export function useShop() {
	const context = useContext(ShopContext);
	if (!context) {
		throw new Error("useShop must be used within a ShopProvider");
	}
	return context;
}

export function useShopOptional() {
	return useContext(ShopContext);
}
