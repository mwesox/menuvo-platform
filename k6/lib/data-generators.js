/**
 * Test data generators for k6 load tests.
 *
 * Generates realistic test data for merchants, stores, menus, and orders.
 * All prices are in cents (integers) to match the database schema.
 */

import { randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

// ============================================================================
// CONSTANTS
// ============================================================================

const ORDER_TYPES = ["dine_in", "takeaway"];
const PAYMENT_METHODS = ["stripe", "mollie"];

const SAMPLE_ITEMS = [
	{ name: "Margherita Pizza", price: 1290 },
	{ name: "Pepperoni Pizza", price: 1490 },
	{ name: "Caesar Salad", price: 890 },
	{ name: "Spaghetti Carbonara", price: 1390 },
	{ name: "Tiramisu", price: 690 },
	{ name: "Bruschetta", price: 590 },
	{ name: "Risotto", price: 1490 },
	{ name: "Gelato", price: 490 },
];

const SAMPLE_CATEGORIES = [
	{ name: "Starters", displayOrder: 0 },
	{ name: "Main Courses", displayOrder: 1 },
	{ name: "Desserts", displayOrder: 2 },
	{ name: "Drinks", displayOrder: 3 },
];

const OPTION_GROUPS = [
	{
		name: "Size",
		isRequired: true,
		choices: [
			{ name: "Small", priceModifier: 0 },
			{ name: "Medium", priceModifier: 200 },
			{ name: "Large", priceModifier: 400 },
		],
	},
	{
		name: "Extra Toppings",
		isRequired: false,
		choices: [
			{ name: "Extra Cheese", priceModifier: 150 },
			{ name: "Mushrooms", priceModifier: 100 },
			{ name: "Olives", priceModifier: 100 },
		],
	},
];

// ============================================================================
// MERCHANT & STORE GENERATORS
// ============================================================================

/**
 * Generate a unique merchant for load testing.
 * Each VU gets its own unique merchant to avoid conflicts.
 *
 * @param {number} vuId - Virtual user ID from k6
 * @returns {object} Merchant data
 */
export function generateMerchant(vuId) {
	const timestamp = Date.now();
	const uniqueId = `${vuId}-${timestamp}`;

	return {
		email: `loadtest+${uniqueId}@menuvo.app`,
		password: "LoadTest123!",
		firstName: "Load",
		lastName: `Test ${vuId}`,
		companyName: `Load Test Restaurant ${uniqueId}`,
	};
}

/**
 * Generate a store configuration.
 *
 * @param {number} merchantId - Merchant ID
 * @param {number} vuId - Virtual user ID
 * @returns {object} Store data
 */
export function generateStore(merchantId, vuId) {
	const timestamp = Date.now();

	return {
		merchantId,
		name: `Load Test Restaurant ${vuId}`,
		slug: `load-test-${vuId}-${timestamp}`,
		description: "A test restaurant for load testing",
		address: "123 Test Street",
		city: "Berlin",
		postalCode: "10115",
		country: "Germany",
		timezone: "Europe/Berlin",
		isActive: true,
		defaultLanguage: "en",
		// Store hours (open 24/7 for testing)
		hours: [
			{ dayOfWeek: "monday", openTime: "00:00", closeTime: "23:59" },
			{ dayOfWeek: "tuesday", openTime: "00:00", closeTime: "23:59" },
			{ dayOfWeek: "wednesday", openTime: "00:00", closeTime: "23:59" },
			{ dayOfWeek: "thursday", openTime: "00:00", closeTime: "23:59" },
			{ dayOfWeek: "friday", openTime: "00:00", closeTime: "23:59" },
			{ dayOfWeek: "saturday", openTime: "00:00", closeTime: "23:59" },
			{ dayOfWeek: "sunday", openTime: "00:00", closeTime: "23:59" },
		],
	};
}

// ============================================================================
// MENU GENERATORS
// ============================================================================

/**
 * Generate categories for a store.
 *
 * @param {number} storeId - Store ID
 * @returns {Array} Array of category data
 */
export function generateCategories(storeId) {
	return SAMPLE_CATEGORIES.map((cat, index) => ({
		storeId,
		name: cat.name,
		description: `${cat.name} category`,
		displayOrder: cat.displayOrder,
		isActive: true,
		translations: {
			en: { name: cat.name, description: `${cat.name} category` },
			de: { name: `${cat.name} (DE)`, description: `${cat.name} Kategorie` },
		},
	}));
}

/**
 * Generate menu items for a category.
 *
 * @param {number} categoryId - Category ID
 * @param {number} count - Number of items to generate
 * @returns {Array} Array of item data
 */
export function generateItems(categoryId, count = 5) {
	const items = [];

	for (let i = 0; i < count; i++) {
		const sampleItem = SAMPLE_ITEMS[i % SAMPLE_ITEMS.length];
		const price = sampleItem.price + randomIntBetween(-100, 100);

		items.push({
			categoryId,
			name: `${sampleItem.name} ${i + 1}`,
			description: `Delicious ${sampleItem.name.toLowerCase()}`,
			price: Math.max(100, price),
			displayOrder: i,
			isActive: true,
			translations: {
				en: {
					name: `${sampleItem.name} ${i + 1}`,
					description: `Delicious ${sampleItem.name.toLowerCase()}`,
				},
				de: {
					name: `${sampleItem.name} ${i + 1} (DE)`,
					description: `Leckere ${sampleItem.name.toLowerCase()}`,
				},
			},
		});
	}

	return items;
}

/**
 * Generate option groups for an item.
 *
 * @param {number} itemId - Item ID
 * @returns {Array} Array of option group data with choices
 */
export function generateOptionGroups(itemId) {
	return OPTION_GROUPS.map((group, index) => ({
		itemId,
		name: group.name,
		isRequired: group.isRequired,
		minSelections: group.isRequired ? 1 : 0,
		maxSelections: group.isRequired ? 1 : 3,
		displayOrder: index,
		choices: group.choices.map((choice, choiceIndex) => ({
			name: choice.name,
			priceModifier: choice.priceModifier,
			displayOrder: choiceIndex,
			isActive: true,
		})),
	}));
}

// ============================================================================
// ORDER GENERATORS
// ============================================================================

/**
 * Generate a random customer.
 *
 * @returns {object} Customer data
 */
export function generateCustomer() {
	const id = randomIntBetween(1, 999999);

	return {
		customerName: `Load Test Customer ${id}`,
		customerEmail: `loadtest+customer${id}@menuvo.app`,
		customerPhone: `+49170${id.toString().padStart(7, "0")}`,
	};
}

/**
 * Generate an order item from menu item data.
 *
 * @param {object} menuItem - Menu item data (id, name, price, optionGroups)
 * @param {number} quantity - Quantity to order
 * @returns {object} Order item data
 */
export function generateOrderItem(menuItem, quantity = 1) {
	const selectedOptions = [];
	let optionsPrice = 0;

	// Randomly select options from option groups
	if (menuItem.optionGroups && menuItem.optionGroups.length > 0) {
		for (const group of menuItem.optionGroups) {
			if (group.isRequired || Math.random() > 0.5) {
				const choice = randomItem(group.choices);
				if (choice) {
					selectedOptions.push({
						optionGroupId: group.id,
						optionChoiceId: choice.id,
						groupName: group.name,
						choiceName: choice.name,
						quantity: 1,
						priceModifier: choice.priceModifier || 0,
					});
					optionsPrice += choice.priceModifier || 0;
				}
			}
		}
	}

	const unitPrice = menuItem.price;
	const totalPrice = (unitPrice + optionsPrice) * quantity;

	return {
		itemId: menuItem.id,
		name: menuItem.name,
		description: menuItem.description || "",
		quantity,
		unitPrice,
		optionsPrice,
		totalPrice,
		options: selectedOptions,
	};
}

/**
 * Generate a complete order payload.
 *
 * @param {number} storeId - Store ID
 * @param {Array} menuItems - Array of menu items with optionGroups
 * @param {number} servicePointId - Optional service point ID for dine-in
 * @returns {object} Order payload matching createOrderSchema
 */
export function generateOrder(storeId, menuItems, servicePointId = null) {
	const customer = generateCustomer();
	const items = [];
	let subtotal = 0;

	// Pick 1-5 random items
	const itemCount = randomIntBetween(1, Math.min(5, menuItems.length));

	for (let i = 0; i < itemCount; i++) {
		const menuItem = randomItem(menuItems);
		const quantity = randomIntBetween(1, 3);
		const orderItem = generateOrderItem(menuItem, quantity);
		items.push(orderItem);
		subtotal += orderItem.totalPrice;
	}

	const taxAmount = Math.round(subtotal * 0.19); // 19% VAT
	const tipAmount = Math.random() > 0.7 ? Math.round(subtotal * 0.1) : 0;
	const totalAmount = subtotal + taxAmount + tipAmount;

	const orderType = randomItem(ORDER_TYPES);
	const paymentMethod = randomItem(PAYMENT_METHODS);

	return {
		storeId,
		items,
		orderType,
		servicePointId: orderType === "dine_in" ? servicePointId : undefined,
		...customer,
		customerNotes: Math.random() > 0.8 ? "No onions please" : "",
		paymentMethod,
		subtotal,
		taxAmount,
		tipAmount,
		totalAmount,
	};
}

/**
 * Generate a simple order for testing (without option groups).
 *
 * @param {number} storeId - Store ID
 * @returns {object} Simple order payload
 */
export function generateSimpleOrder(storeId) {
	const customer = generateCustomer();
	const itemCount = randomIntBetween(1, 3);
	const items = [];
	let subtotal = 0;

	for (let i = 0; i < itemCount; i++) {
		const sampleItem = randomItem(SAMPLE_ITEMS);
		const quantity = randomIntBetween(1, 2);
		const totalPrice = sampleItem.price * quantity;

		items.push({
			itemId: i + 1, // Placeholder ID
			name: sampleItem.name,
			description: `Fresh ${sampleItem.name.toLowerCase()}`,
			quantity,
			unitPrice: sampleItem.price,
			optionsPrice: 0,
			totalPrice,
			options: [],
		});

		subtotal += totalPrice;
	}

	const taxAmount = Math.round(subtotal * 0.19);
	const tipAmount = 0;
	const totalAmount = subtotal + taxAmount;

	return {
		storeId,
		items,
		orderType: randomItem(ORDER_TYPES),
		...customer,
		customerNotes: "",
		paymentMethod: randomItem(PAYMENT_METHODS),
		subtotal,
		taxAmount,
		tipAmount,
		totalAmount,
	};
}

// ============================================================================
// STATUS UPDATE GENERATORS
// ============================================================================

/**
 * Get the next valid status transition for an order.
 *
 * @param {string} currentStatus - Current order status
 * @returns {string} Next status or null if terminal
 */
export function getNextStatus(currentStatus) {
	const transitions = {
		confirmed: "preparing",
		preparing: "ready",
		ready: "completed",
	};

	return transitions[currentStatus] || null;
}

/**
 * Generate a status update payload.
 *
 * @param {number} orderId - Order ID
 * @param {string} currentStatus - Current order status
 * @returns {object} Status update payload
 */
export function generateStatusUpdate(orderId, currentStatus) {
	const nextStatus = getNextStatus(currentStatus);

	return {
		orderId,
		status: nextStatus || "preparing",
	};
}
