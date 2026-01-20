import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type React from "react";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { i18n } from "../../../i18n";
import { TRPCProvider, trpcClient } from "../../../lib/trpc";
import type { MenuItemLight } from "../types";
import { ItemDrawer } from "./item-drawer";

// Cleanup after each test
afterEach(() => {
	cleanup();
});

// Mock the cart store
vi.mock("../../cart", () => ({
	useCartStore: vi.fn(() => vi.fn()),
}));

// Mock the shop shared components
vi.mock("../../shared", () => ({
	QuantityStepper: ({
		value,
		onChange,
	}: {
		value: number;
		onChange: (n: number) => void;
	}) => (
		<div data-testid="quantity-stepper">
			<button type="button" onClick={() => onChange(value - 1)}>
				-
			</button>
			<span>{value}</span>
			<button type="button" onClick={() => onChange(value + 1)}>
				+
			</button>
		</div>
	),
	ShopButton: ({ children, ...props }: React.ComponentProps<"button">) => (
		<button {...props}>{children}</button>
	),
	ShopHeading: ({
		children,
		as: Component = "h2",
		...props
	}: {
		children: React.ReactNode;
		as?: keyof JSX.IntrinsicElements;
	}) => <Component {...props}>{children}</Component>,
}));

// Create a wrapper with QueryClient for tests
const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
				<I18nextProvider i18n={i18n}>{children}</I18nextProvider>
			</TRPCProvider>
		</QueryClientProvider>
	);
};

// Create minimal mock item for testing (MenuItemLight - options fetched on-demand)
const mockItem: MenuItemLight = {
	id: "item-1",
	name: "Margherita Pizza",
	kitchenName: null,
	description: "Fresh tomato sauce, mozzarella, and basil",
	price: 1299,
	imageUrl: "https://example.com/pizza.jpg",
	allergens: ["Gluten", "Dairy"],
	displayOrder: 1,
	hasOptionGroups: true,
};

// Simple item without options
const mockSimpleItem: MenuItemLight = {
	id: "item-2",
	name: "Garlic Bread",
	kitchenName: null,
	description: "Freshly baked with garlic butter",
	price: 499,
	imageUrl: null,
	allergens: null,
	displayOrder: 2,
	hasOptionGroups: false,
};

describe("ItemDrawer", () => {
	it("renders null when item is null", () => {
		const { container } = render(
			<ItemDrawer
				item={null}
				open={true}
				onOpenChange={vi.fn()}
				storeId="store-1"
				storeSlug="test-store"
				isOpen={true}
			/>,
			{ wrapper: createWrapper() },
		);

		// Should render nothing
		expect(container.firstChild).toBeNull();
	});

	it("renders item name when open with item", () => {
		render(
			<ItemDrawer
				item={mockItem}
				open={true}
				onOpenChange={vi.fn()}
				storeId="store-1"
				storeSlug="test-store"
				isOpen={true}
			/>,
			{ wrapper: createWrapper() },
		);

		// Item name should be visible
		expect(screen.getByText("Margherita Pizza")).toBeInTheDocument();
	});

	it("renders item description", () => {
		render(
			<ItemDrawer
				item={mockItem}
				open={true}
				onOpenChange={vi.fn()}
				storeId="store-1"
				storeSlug="test-store"
				isOpen={true}
			/>,
			{ wrapper: createWrapper() },
		);

		// Drawer renders to portal, check document.body
		expect(document.body.textContent).toContain(
			"Fresh tomato sauce, mozzarella, and basil",
		);
	});

	it("renders allergens", () => {
		render(
			<ItemDrawer
				item={mockItem}
				open={true}
				onOpenChange={vi.fn()}
				storeId="store-1"
				storeSlug="test-store"
				isOpen={true}
			/>,
			{ wrapper: createWrapper() },
		);

		// Drawer renders to portal, check document.body
		// Allergens shown as "Contains: Gluten, Dairy"
		expect(document.body.textContent).toContain("Gluten, Dairy");
		expect(document.body.textContent).toContain("Contains:");
	});

	it("renders simple item without options", () => {
		render(
			<ItemDrawer
				item={mockSimpleItem}
				open={true}
				onOpenChange={vi.fn()}
				storeId="store-1"
				storeSlug="test-store"
				isOpen={true}
			/>,
			{ wrapper: createWrapper() },
		);

		expect(screen.getByText("Garlic Bread")).toBeInTheDocument();
		expect(
			screen.getByText("Freshly baked with garlic butter"),
		).toBeInTheDocument();
	});

	it("renders Add button with price", () => {
		render(
			<ItemDrawer
				item={mockSimpleItem}
				open={true}
				onOpenChange={vi.fn()}
				storeId="store-1"
				storeSlug="test-store"
				isOpen={true}
			/>,
			{ wrapper: createWrapper() },
		);

		// The Add button should show the total price
		// €4.99 base price for 1 qty (matches both 4.99 and 4,99 locale formats)
		const addButton = screen.getByRole("button", { name: /4[.,]99/i });
		expect(addButton).toBeInTheDocument();
	});
});

describe("ItemDrawer DOM verification", () => {
	it("renders complete drawer content in portal", () => {
		render(
			<ItemDrawer
				item={mockItem}
				open={true}
				onOpenChange={vi.fn()}
				storeId="store-1"
				storeSlug="test-store"
				isOpen={true}
			/>,
			{ wrapper: createWrapper() },
		);

		// Drawer uses portal - content renders to document.body
		const portalContent = document.body.innerHTML;

		// Verify key elements exist in the portal (options are fetched async)
		expect(portalContent).toContain("Margherita Pizza");
		expect(portalContent).toContain("Fresh tomato sauce");
		expect(portalContent).toContain("Gluten");
		expect(portalContent).toContain("Dairy");
	});
});
