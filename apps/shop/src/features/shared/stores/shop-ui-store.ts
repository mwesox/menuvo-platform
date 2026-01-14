import { create } from "zustand";

// ============================================================================
// Types
// ============================================================================

interface ShopUIState {
	// Cart drawer
	isCartDrawerOpen: boolean;
	openCartDrawer: () => void;
	closeCartDrawer: () => void;

	// Menu search
	searchQuery: string;
	setSearchQuery: (query: string) => void;
}

// ============================================================================
// Store
// ============================================================================

export const useShopUIStore = create<ShopUIState>((set) => ({
	// State
	isCartDrawerOpen: false,
	searchQuery: "",

	// Actions
	openCartDrawer: () => set({ isCartDrawerOpen: true }),
	closeCartDrawer: () => set({ isCartDrawerOpen: false }),
	setSearchQuery: (query: string) => set({ searchQuery: query }),
}));
