"use client";

import { useCallback, useState } from "react";
import type { MenuItem, MenuItemWithDefaults } from "../../schemas";
import { enrichMenuItemWithDefaults } from "../../utils";

interface UseMenuItemSelectionReturn {
	selectedItem: MenuItemWithDefaults | null;
	isItemDrawerOpen: boolean;
	handleItemSelect: (item: MenuItem) => void;
	setIsItemDrawerOpen: (open: boolean) => void;
}

/**
 * Hook for managing menu item selection state and drawer visibility.
 * Automatically enriches selected items with default choice flags.
 */
export function useMenuItemSelection(): UseMenuItemSelectionReturn {
	const [selectedItem, setSelectedItem] = useState<MenuItemWithDefaults | null>(
		null,
	);
	const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);

	const handleItemSelect = useCallback((item: MenuItem) => {
		const itemWithDefaults = enrichMenuItemWithDefaults(item);
		setSelectedItem(itemWithDefaults);
		setIsItemDrawerOpen(true);
	}, []);

	return {
		selectedItem,
		isItemDrawerOpen,
		handleItemSelect,
		setIsItemDrawerOpen,
	};
}
