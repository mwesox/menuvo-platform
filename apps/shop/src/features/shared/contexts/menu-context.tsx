import { createContext, type ReactNode } from "react";
import type { MenuCategory, MenuData } from "../../menu/types";

interface MenuContextValue {
	store: MenuData["store"] | null;
	categories: MenuCategory[];
}

export const MenuContext = createContext<MenuContextValue>({
	store: null,
	categories: [],
});

interface MenuProviderProps {
	children: ReactNode;
	store: MenuData["store"];
	categories: MenuCategory[];
}

export function MenuProvider({
	children,
	store,
	categories,
}: MenuProviderProps) {
	return (
		<MenuContext.Provider value={{ store, categories }}>
			{children}
		</MenuContext.Provider>
	);
}
