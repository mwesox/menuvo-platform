import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateCartItemId } from "../../utils";

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

interface CartActions {
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

interface CartComputed {
	/** Total quantity of all items */
	itemCount: number;
	/** Total price in cents */
	subtotal: number;
}

export type CartStore = CartState & CartActions & CartComputed;

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

// ============================================================================
// Store
// ============================================================================

export const useCartStore = create<CartStore>()(
	persist(
		(set, get) => ({
			// State
			items: [],
			storeSlug: null,

			// Computed
			get itemCount() {
				return get().items.reduce((sum, item) => sum + item.quantity, 0);
			},

			get subtotal() {
				return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
			},

			// Actions
			addItem: (item) => {
				const id = generateCartItemId(item.itemId, item.selectedOptions);
				const totalPrice = calculateTotalPrice(
					item.basePrice,
					item.quantity,
					item.selectedOptions,
				);

				set((state) => {
					// Check if item with same ID already exists
					const existingIndex = state.items.findIndex((i) => i.id === id);

					if (existingIndex >= 0) {
						// Increment quantity instead of duplicating
						const updatedItems = [...state.items];
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
						return { items: updatedItems };
					}

					// Add new item
					const newItem: CartItem = {
						...item,
						id,
						totalPrice,
					};

					return {
						items: [...state.items, newItem],
						storeSlug: item.storeSlug,
					};
				});
			},

			updateQuantity: (cartItemId, quantity) => {
				if (quantity < 1) {
					// Remove item if quantity is less than 1
					set((state) => ({
						items: state.items.filter((i) => i.id !== cartItemId),
					}));
					return;
				}

				set((state) => ({
					items: state.items.map((item) =>
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
			},

			removeItem: (cartItemId) => {
				set((state) => ({
					items: state.items.filter((i) => i.id !== cartItemId),
				}));
			},

			clearCart: () => {
				set({ items: [], storeSlug: null });
			},

			setStore: (slug) => {
				const currentSlug = get().storeSlug;
				if (currentSlug === slug) {
					return false;
				}

				// Different store - clear the cart
				set({ items: [], storeSlug: slug });
				return true;
			},
		}),
		{
			name: "menuvo-cart",
			// Validate persisted data on rehydration - filter out invalid items
			merge: (persistedState, currentState) => {
				const persisted = persistedState as Partial<CartState> | undefined;
				if (!persisted) return currentState;

				// Filter out items with missing required fields
				const validItems = (persisted.items ?? []).filter((item) => {
					const isValid =
						typeof item.id === "string" &&
						typeof item.itemId === "number" &&
						typeof item.name === "string" &&
						item.name.length > 0 &&
						typeof item.basePrice === "number" &&
						typeof item.quantity === "number" &&
						typeof item.totalPrice === "number";

					if (!isValid) {
						// Silently filter invalid items - storage data corrupted
					}
					return isValid;
				});

				return {
					...currentState,
					items: validItems,
					storeSlug: persisted.storeSlug ?? null,
				};
			},
		},
	),
);
