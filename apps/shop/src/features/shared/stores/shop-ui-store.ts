import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

interface ShopUIState {
	// Cart drawer (mobile)
	isCartDrawerOpen: boolean;
	openCartDrawer: () => void;
	closeCartDrawer: () => void;

	// Cart sidebar (desktop)
	isCartSidebarCollapsed: boolean;
	toggleCartSidebar: () => void;

	// Menu search
	searchQuery: string;
	setSearchQuery: (query: string) => void;

	// Category navigation
	activeCategoryId: string | null;
	setActiveCategoryId: (id: string | null) => void;
	categoryRefs: Map<string, HTMLDivElement>;
	setCategoryRef: (id: string, el: HTMLDivElement | null) => void;
	scrollContainerRef: HTMLElement | null;
	setScrollContainerRef: (el: HTMLElement | null) => void;
}

// ============================================================================
// Store
// ============================================================================

const STORAGE_KEY = "menuvo-shop-ui";

export const useShopUIStore = create<ShopUIState>()(
	persist(
		(set, get) => ({
			// State
			isCartDrawerOpen: false,
			isCartSidebarCollapsed: false,
			searchQuery: "",
			activeCategoryId: null,
			categoryRefs: new Map(),
			scrollContainerRef: null,

			// Actions
			openCartDrawer: () => set({ isCartDrawerOpen: true }),
			closeCartDrawer: () => set({ isCartDrawerOpen: false }),
			toggleCartSidebar: () =>
				set((state) => ({
					isCartSidebarCollapsed: !state.isCartSidebarCollapsed,
				})),
			setSearchQuery: (query: string) => set({ searchQuery: query }),
			setActiveCategoryId: (id: string | null) => set({ activeCategoryId: id }),
			setCategoryRef: (id: string, el: HTMLDivElement | null) => {
				const refs = get().categoryRefs;
				if (el) {
					refs.set(id, el);
				} else {
					refs.delete(id);
				}
			},
			setScrollContainerRef: (el: HTMLElement | null) =>
				set({ scrollContainerRef: el }),
		}),
		{
			name: STORAGE_KEY,
			partialize: (state) => ({
				// Only persist collapsed state, not drawer open state
				isCartSidebarCollapsed: state.isCartSidebarCollapsed,
			}),
		},
	),
);
