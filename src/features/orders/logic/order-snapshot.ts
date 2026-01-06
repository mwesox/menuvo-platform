/**
 * Functions for creating order snapshots from cart data.
 * Snapshots preserve item data at the time of order.
 */

import type { OrderType } from "../constants";
import type {
	CreateOrderInput,
	OrderItemInput,
	OrderItemOptionInput,
} from "../types";
import {
	calculateOptionsPrice,
	calculateSubtotal,
	calculateTotal,
} from "./order-pricing";

/**
 * Cart item structure (from Zustand store)
 */
export type CartItem = {
	itemId: number;
	name: string;
	kitchenName?: string | null;
	description?: string;
	basePrice: number;
	quantity: number;
	selectedOptions: CartItemOption[];
	totalPrice: number;
};

export type CartItemOption = {
	optionGroupId: number;
	optionChoiceId: number;
	groupName: string;
	choiceName: string;
	quantity: number;
	priceModifier: number;
};

/**
 * Customer info from checkout form
 */
export type CustomerInfo = {
	name?: string;
	email?: string;
	phone?: string;
	notes?: string;
};

/**
 * Convert a cart item option to order item option input
 */
export function snapshotCartItemOption(
	option: CartItemOption,
): OrderItemOptionInput {
	return {
		optionGroupId: option.optionGroupId,
		optionChoiceId: option.optionChoiceId,
		groupName: option.groupName,
		choiceName: option.choiceName,
		quantity: option.quantity,
		priceModifier: option.priceModifier,
	};
}

/**
 * Convert a cart item to order item input
 */
export function snapshotCartItem(
	cartItem: CartItem,
	_displayOrder: number,
): OrderItemInput {
	const options = cartItem.selectedOptions.map(snapshotCartItemOption);
	const optionsPrice = calculateOptionsPrice(options);
	const totalPrice = (cartItem.basePrice + optionsPrice) * cartItem.quantity;

	return {
		itemId: cartItem.itemId,
		name: cartItem.name,
		kitchenName: cartItem.kitchenName,
		description: cartItem.description,
		quantity: cartItem.quantity,
		unitPrice: cartItem.basePrice,
		optionsPrice,
		totalPrice,
		options,
	};
}

/**
 * Create full order input from cart and customer info
 */
export function snapshotOrder(params: {
	storeId: number;
	cartItems: CartItem[];
	orderType: OrderType;
	paymentMethod: string;
	customerInfo: CustomerInfo;
	servicePointId?: number;
	taxRate?: number;
	tipAmount?: number;
}): CreateOrderInput {
	const {
		storeId,
		cartItems,
		orderType,
		paymentMethod,
		customerInfo,
		servicePointId,
		taxRate = 0,
		tipAmount = 0,
	} = params;

	// Convert cart items to order items
	const items = cartItems.map((item, index) => snapshotCartItem(item, index));

	// Calculate totals
	const subtotal = calculateSubtotal(items);
	const taxAmount = Math.round(subtotal * taxRate);
	const totalAmount = calculateTotal(subtotal, taxAmount, tipAmount);

	return {
		storeId,
		items,
		orderType,
		servicePointId,
		customerName: customerInfo.name,
		customerEmail: customerInfo.email,
		customerPhone: customerInfo.phone,
		customerNotes: customerInfo.notes,
		paymentMethod,
		subtotal,
		taxAmount,
		tipAmount,
		totalAmount,
	};
}

/**
 * Validate cart items have required data for snapshot
 */
export function validateCartForSnapshot(cartItems: CartItem[]): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (cartItems.length === 0) {
		errors.push("Cart is empty");
		return { valid: false, errors };
	}

	for (const item of cartItems) {
		if (!item.itemId || item.itemId <= 0) {
			errors.push(`Invalid item ID for "${item.name}"`);
		}
		if (!item.name) {
			errors.push("Item missing name");
		}
		if (item.quantity < 1) {
			errors.push(`Invalid quantity for "${item.name}"`);
		}
		if (item.basePrice < 0) {
			errors.push(`Invalid price for "${item.name}"`);
		}
	}

	return { valid: errors.length === 0, errors };
}
