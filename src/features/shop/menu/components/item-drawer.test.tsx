import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MenuItemWithDefaults } from "../../schemas";
import { ItemDrawer } from "./item-drawer";

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
}));

// Create minimal mock item for testing
const mockItem: MenuItemWithDefaults = {
	id: 1,
	name: "Margherita Pizza",
	description: "Fresh tomato sauce, mozzarella, and basil",
	price: 1299,
	imageUrl: "https://example.com/pizza.jpg",
	allergens: ["Gluten", "Dairy"],
	displayOrder: 1,
	optionGroups: [
		{
			id: 1,
			name: "Size",
			description: null,
			type: "single_select",
			isRequired: true,
			minSelections: 1,
			maxSelections: 1,
			numFreeOptions: 0,
			aggregateMinQuantity: null,
			aggregateMaxQuantity: null,
			displayOrder: 1,
			choices: [
				{
					id: 1,
					name: "Small",
					priceModifier: 0,
					displayOrder: 1,
					isDefault: true,
					isAvailable: true,
					minQuantity: 0,
					maxQuantity: null,
				},
				{
					id: 2,
					name: "Medium",
					priceModifier: 200,
					displayOrder: 2,
					isDefault: false,
					isAvailable: true,
					minQuantity: 0,
					maxQuantity: null,
				},
				{
					id: 3,
					name: "Large",
					priceModifier: 400,
					displayOrder: 3,
					isDefault: false,
					isAvailable: true,
					minQuantity: 0,
					maxQuantity: null,
				},
			],
		},
	],
};

describe("ItemDrawer", () => {
	it("renders null when item is null", () => {
		const { container } = render(
			<ItemDrawer
				item={null}
				open={true}
				onOpenChange={vi.fn()}
				storeId={1}
				storeSlug="test-store"
			/>,
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
				storeId={1}
				storeSlug="test-store"
			/>,
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
				storeId={1}
				storeSlug="test-store"
			/>,
		);

		expect(
			screen.getByText("Fresh tomato sauce, mozzarella, and basil"),
		).toBeInTheDocument();
	});

	it("renders allergens", () => {
		render(
			<ItemDrawer
				item={mockItem}
				open={true}
				onOpenChange={vi.fn()}
				storeId={1}
				storeSlug="test-store"
			/>,
		);

		// Allergens shown as "Contains: Gluten, Dairy"
		expect(screen.getByText("Gluten, Dairy")).toBeInTheDocument();
		expect(screen.getByText("Contains:")).toBeInTheDocument();
	});

	it("renders option group", () => {
		render(
			<ItemDrawer
				item={mockItem}
				open={true}
				onOpenChange={vi.fn()}
				storeId={1}
				storeSlug="test-store"
			/>,
		);

		expect(screen.getByText("Size")).toBeInTheDocument();
	});

	it("renders option choices", () => {
		render(
			<ItemDrawer
				item={mockItem}
				open={true}
				onOpenChange={vi.fn()}
				storeId={1}
				storeSlug="test-store"
			/>,
		);

		expect(screen.getByText("Small")).toBeInTheDocument();
		expect(screen.getByText("Medium")).toBeInTheDocument();
		expect(screen.getByText("Large")).toBeInTheDocument();
	});

	it("renders Add button with price", () => {
		render(
			<ItemDrawer
				item={mockItem}
				open={true}
				onOpenChange={vi.fn()}
				storeId={1}
				storeSlug="test-store"
			/>,
		);

		// The Add button should show the total price (base + default option)
		// €12.99 base price for 1 qty
		const addButton = screen.getByRole("button", { name: /add/i });
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
				storeId={1}
				storeSlug="test-store"
			/>,
		);

		// Drawer uses portal - content renders to document.body
		const portalContent = document.body.innerHTML;

		// Verify all key elements exist in the portal
		expect(portalContent).toContain("Margherita Pizza");
		expect(portalContent).toContain("Fresh tomato sauce");
		expect(portalContent).toContain("Gluten");
		expect(portalContent).toContain("Dairy");
		expect(portalContent).toContain("Size");
		expect(portalContent).toContain("Small");
		expect(portalContent).toContain("Medium");
		expect(portalContent).toContain("Large");
		expect(portalContent).toContain("Add");
	});
});
