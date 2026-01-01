"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { generateCartItemId } from "./utils";

// ============================================================================
// Types
// ============================================================================

export interface CartItem {
	/** Unique ID: itemId + options hash */
	id: string;
	/** Menu item ID */
	itemId: number;
	/** Item name */
	name: string;
	/** Optional image URL */
	imageUrl?: string;
	/** Base price in cents */
	basePrice: number;
	/** Quantity of this item */
	quantity: number;
	/** Selected options for this item */
	selectedOptions: {
		groupId: number;
		groupName: string;
		choices: { id: number; name: string; price: number }[];
	}[];
	/** Total price in cents: (basePrice + option modifiers) * quantity */
	totalPrice: number;
	/** Store ID this item belongs to */
	storeId: number;
	/** Store slug this item belongs to */
	storeSlug: string;
}

interface CartState {
	items: CartItem[];
	storeSlug: string | null;
}

interface CartContextValue {
	/** All items in the cart */
	items: CartItem[];
	/** Current store slug the cart is tied to */
	storeSlug: string | null;
	/** Total quantity of all items */
	itemCount: number;
	/** Total price in cents */
	subtotal: number;
	/** Add an item to the cart */
	addItem: (item: Omit<CartItem, "id" | "totalPrice">) => void;
	/** Update the quantity of an item */
	updateQuantity: (cartItemId: string, quantity: number) => void;
	/** Remove an item from the cart */
	removeItem: (cartItemId: string) => void;
	/** Clear all items from the cart */
	clearCart: () => void;
	/** Set the store for the cart. Returns true if cart was cleared (different store), false if same store */
	setStore: (slug: string) => boolean;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "menuvo-cart";

const INITIAL_STATE: CartState = {
	items: [],
	storeSlug: null,
};

// ============================================================================
// Context
// ============================================================================

const CartContext = createContext<CartContextValue | null>(null);

// ============================================================================
// Utilities
// ============================================================================

/**
 * Calculate the total price for a cart item.
 * Total = (basePrice + sum of option prices) * quantity
 */
function calculateTotalPrice(
	basePrice: number,
	quantity: number,
	selectedOptions: CartItem["selectedOptions"],
): number {
	const optionTotal = selectedOptions.reduce((sum, group) => {
		return sum + group.choices.reduce((choiceSum, c) => choiceSum + c.price, 0);
	}, 0);

	return (basePrice + optionTotal) * quantity;
}

/**
 * Load cart state from localStorage.
 */
function loadFromStorage(): CartState {
	if (typeof window === "undefined") {
		return INITIAL_STATE;
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return INITIAL_STATE;
		}

		const parsed = JSON.parse(stored) as CartState;

		// Validate structure
		if (!Array.isArray(parsed.items)) {
			return INITIAL_STATE;
		}

		return parsed;
	} catch {
		return INITIAL_STATE;
	}
}

/**
 * Save cart state to localStorage.
 */
function saveToStorage(state: CartState): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Storage might be full or disabled - silently fail
	}
}

// ============================================================================
// Provider
// ============================================================================

interface CartProviderProps {
	children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
	const [state, setState] = useState<CartState>(INITIAL_STATE);
	const [isHydrated, setIsHydrated] = useState(false);

	// Hydrate from localStorage on mount
	useEffect(() => {
		const stored = loadFromStorage();
		setState(stored);
		setIsHydrated(true);
	}, []);

	// Persist to localStorage whenever state changes (after hydration)
	useEffect(() => {
		if (isHydrated) {
			saveToStorage(state);
		}
	}, [state, isHydrated]);

	const addItem = useCallback((item: Omit<CartItem, "id" | "totalPrice">) => {
		const id = generateCartItemId(item.itemId, item.selectedOptions);
		const totalPrice = calculateTotalPrice(
			item.basePrice,
			item.quantity,
			item.selectedOptions,
		);

		setState((prev) => {
			// Check if item with same ID already exists
			const existingIndex = prev.items.findIndex((i) => i.id === id);

			if (existingIndex >= 0) {
				// Increment quantity instead of duplicating
				const updatedItems = [...prev.items];
				const existing = updatedItems[existingIndex];
				const newQuantity = existing.quantity + item.quantity;
				updatedItems[existingIndex] = {
					...existing,
					quantity: newQuantity,
					totalPrice: calculateTotalPrice(
						existing.basePrice,
						newQuantity,
						existing.selectedOptions,
					),
				};
				return { ...prev, items: updatedItems };
			}

			// Add new item
			const newItem: CartItem = {
				...item,
				id,
				totalPrice,
			};

			return {
				...prev,
				items: [...prev.items, newItem],
				storeSlug: item.storeSlug,
			};
		});
	}, []);

	const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
		if (quantity < 1) {
			// Remove item if quantity is less than 1
			setState((prev) => ({
				...prev,
				items: prev.items.filter((i) => i.id !== cartItemId),
			}));
			return;
		}

		setState((prev) => ({
			...prev,
			items: prev.items.map((item) =>
				item.id === cartItemId
					? {
							...item,
							quantity,
							totalPrice: calculateTotalPrice(
								item.basePrice,
								quantity,
								item.selectedOptions,
							),
						}
					: item,
			),
		}));
	}, []);

	const removeItem = useCallback((cartItemId: string) => {
		setState((prev) => ({
			...prev,
			items: prev.items.filter((i) => i.id !== cartItemId),
		}));
	}, []);

	const clearCart = useCallback(() => {
		setState(INITIAL_STATE);
	}, []);

	const setStore = useCallback(
		(slug: string): boolean => {
			if (state.storeSlug === slug) {
				return false;
			}

			// Different store - clear the cart
			setState({
				items: [],
				storeSlug: slug,
			});
			return true;
		},
		[state.storeSlug],
	);

	const itemCount = useMemo(() => {
		return state.items.reduce((sum, item) => sum + item.quantity, 0);
	}, [state.items]);

	const subtotal = useMemo(() => {
		return state.items.reduce((sum, item) => sum + item.totalPrice, 0);
	}, [state.items]);

	const value: CartContextValue = useMemo(
		() => ({
			items: state.items,
			storeSlug: state.storeSlug,
			itemCount,
			subtotal,
			addItem,
			updateQuantity,
			removeItem,
			clearCart,
			setStore,
		}),
		[
			state.items,
			state.storeSlug,
			itemCount,
			subtotal,
			addItem,
			updateQuantity,
			removeItem,
			clearCart,
			setStore,
		],
	);

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access the cart context.
 * @throws Error if used outside of CartProvider
 */
export function useCart(): CartContextValue {
	const context = useContext(CartContext);

	if (!context) {
		throw new Error("useCart must be used within a CartProvider");
	}

	return context;
}

/**
 * Hook to optionally access the cart context.
 * Returns null if used outside of CartProvider (useful for header components that may render before provider).
 */
export function useCartOptional(): CartContextValue | null {
	return useContext(CartContext);
}
