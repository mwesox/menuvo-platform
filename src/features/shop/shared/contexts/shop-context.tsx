"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";

interface ShopContextValue {
	storeName: string | null;
	setStoreName: (name: string | null) => void;
	isCartDrawerOpen: boolean;
	openCartDrawer: () => void;
	closeCartDrawer: () => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

interface ShopProviderProps {
	children: ReactNode;
}

export function ShopProvider({ children }: ShopProviderProps) {
	const [storeName, setStoreNameState] = useState<string | null>(null);
	const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

	const setStoreName = useCallback((name: string | null) => {
		setStoreNameState(name);
	}, []);

	const openCartDrawer = useCallback(() => {
		setIsCartDrawerOpen(true);
	}, []);

	const closeCartDrawer = useCallback(() => {
		setIsCartDrawerOpen(false);
	}, []);

	return (
		<ShopContext.Provider
			value={{
				storeName,
				setStoreName,
				isCartDrawerOpen,
				openCartDrawer,
				closeCartDrawer,
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
