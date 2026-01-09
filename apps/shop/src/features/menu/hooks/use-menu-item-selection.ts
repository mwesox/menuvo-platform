import { useCallback, useState } from "react";
import type { MenuItemLight } from "../../schemas";

interface UseMenuItemSelectionReturn {
	selectedItem: MenuItemLight | null;
	isItemDrawerOpen: boolean;
	handleItemSelect: (item: MenuItemLight) => void;
	setIsItemDrawerOpen: (open: boolean) => void;
}

/**
 * Hook for managing menu item selection state and drawer visibility.
 * Stores light item data - option groups are fetched on demand by ItemDrawer.
 */
export function useMenuItemSelection(): UseMenuItemSelectionReturn {
	const [selectedItem, setSelectedItem] = useState<MenuItemLight | null>(null);
	const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);

	const handleItemSelect = useCallback((item: MenuItemLight) => {
		setSelectedItem(item);
		setIsItemDrawerOpen(true);
	}, []);

	return {
		selectedItem,
		isItemDrawerOpen,
		handleItemSelect,
		setIsItemDrawerOpen,
	};
}
