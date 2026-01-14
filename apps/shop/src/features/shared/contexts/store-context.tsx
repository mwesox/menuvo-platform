import { createContext, type ReactNode } from "react";

interface Store {
	id: string;
	slug: string;
	name: string;
	street: string | null;
	city: string | null;
}

interface StoreContextValue {
	store: Store | null;
}

export const StoreContext = createContext<StoreContextValue>({ store: null });

interface StoreProviderProps {
	children: ReactNode;
	store: Store | null;
}

export function StoreProvider({ children, store }: StoreProviderProps) {
	return (
		<StoreContext.Provider value={{ store }}>{children}</StoreContext.Provider>
	);
}
