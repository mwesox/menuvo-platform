/**
 * Mock shop server functions for client tests.
 * Prevents server-side code from being loaded in jsdom environment.
 */

export const getPublicStores = () => Promise.resolve([]);
export const getStoreBySlug = () => Promise.resolve(null);
export const getShopMenu = () => Promise.resolve(null);
export const getItemOptions = () => Promise.resolve({ optionGroups: [] });
export const getStorePaymentCapability = () =>
	Promise.resolve({ acceptsOnlinePayment: false });
