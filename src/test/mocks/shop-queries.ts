/**
 * Mock shop queries for client tests.
 * Prevents server-side code from being loaded in jsdom environment.
 */

export const shopKeys = {
	all: ["shop"] as const,
	stores: () => [...shopKeys.all, "stores"] as const,
	storesByFilters: (filters: unknown) =>
		[...shopKeys.stores(), filters ?? {}] as const,
	store: (slug: string) => [...shopKeys.all, "store", slug] as const,
	menu: (slug: string) => [...shopKeys.all, "menu", slug] as const,
	itemOptions: (itemId: number) =>
		[...shopKeys.all, "itemOptions", itemId] as const,
};

export const shopQueries = {
	stores: () => ({
		queryKey: shopKeys.storesByFilters({}),
		queryFn: () => Promise.resolve([]),
		staleTime: 1000 * 60 * 5,
	}),

	storeBySlug: (slug: string) => ({
		queryKey: shopKeys.store(slug),
		queryFn: () => Promise.resolve(null),
		staleTime: 1000 * 60 * 5,
		enabled: !!slug,
	}),

	menu: (slug: string) => ({
		queryKey: shopKeys.menu(slug),
		queryFn: () => Promise.resolve(null),
		staleTime: 1000 * 60 * 5,
		enabled: !!slug,
	}),

	itemOptions: (itemId: number, _storeSlug: string) => ({
		queryKey: shopKeys.itemOptions(itemId),
		queryFn: () => Promise.resolve({ optionGroups: [] }),
		staleTime: 1000 * 60 * 5,
		enabled: !!itemId,
	}),
};
