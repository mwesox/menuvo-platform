import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { i18n } from "../../../i18n";
import { OptionGroup } from "./option-group";

// Create a wrapper with I18nextProvider for tests
const createWrapper = () => {
	return ({ children }: { children: React.ReactNode }) => (
		<I18nextProvider i18n={i18n}>{children}</I18nextProvider>
	);
};

// Cleanup after each test
afterEach(() => {
	cleanup();
});

const mockSingleSelectGroup = {
	id: "grp-1",
	name: "Size",
	type: "single_select" as const,
	isRequired: true,
	minSelections: 1,
	maxSelections: 1,
	numFreeOptions: 0,
	aggregateMinQuantity: null,
	aggregateMaxQuantity: null,
};

const mockMultiSelectGroup = {
	id: "grp-2",
	name: "Toppings",
	type: "multi_select" as const,
	isRequired: false,
	minSelections: 0,
	maxSelections: 3,
	numFreeOptions: 0,
	aggregateMinQuantity: null,
	aggregateMaxQuantity: null,
};

const mockChoices = [
	{
		id: "choice-1",
		name: "Small",
		priceModifier: 0,
		displayOrder: 1,
		isDefault: true,
		isAvailable: true,
		minQuantity: 0,
		maxQuantity: null,
	},
	{
		id: "choice-2",
		name: "Medium",
		priceModifier: 200,
		displayOrder: 2,
		isDefault: false,
		isAvailable: true,
		minQuantity: 0,
		maxQuantity: null,
	},
	{
		id: "choice-3",
		name: "Large",
		priceModifier: 400,
		displayOrder: 3,
		isDefault: false,
		isAvailable: true,
		minQuantity: 0,
		maxQuantity: null,
	},
];

const mockToppingChoices = [
	{
		id: "choice-4",
		name: "Extra Cheese",
		priceModifier: 150,
		displayOrder: 1,
		isDefault: false,
		isAvailable: true,
		minQuantity: 0,
		maxQuantity: null,
	},
	{
		id: "choice-5",
		name: "Pepperoni",
		priceModifier: 200,
		displayOrder: 2,
		isDefault: false,
		isAvailable: true,
		minQuantity: 0,
		maxQuantity: null,
	},
	{
		id: "choice-6",
		name: "Mushrooms",
		priceModifier: 100,
		displayOrder: 3,
		isDefault: false,
		isAvailable: true,
		minQuantity: 0,
		maxQuantity: null,
	},
];

describe("OptionGroup", () => {
	describe("Single Select (Radio)", () => {
		it("renders group name", () => {
			render(
				<OptionGroup
					group={mockSingleSelectGroup}
					choices={mockChoices}
					selectedChoiceIds={["choice-1"]}
					quantitySelections={new Map()}
					onSelectionChange={vi.fn()}
					onQuantityChange={vi.fn()}
				/>,
				{ wrapper: createWrapper() },
			);

			expect(screen.getByText("Size")).toBeInTheDocument();
		});

		it("renders all choices", () => {
			const { container } = render(
				<OptionGroup
					group={mockSingleSelectGroup}
					choices={mockChoices}
					selectedChoiceIds={["choice-1"]}
					quantitySelections={new Map()}
					onSelectionChange={vi.fn()}
					onQuantityChange={vi.fn()}
				/>,
				{ wrapper: createWrapper() },
			);

			// Use container to scope the query to this specific render
			expect(container.textContent).toContain("Small");
			expect(container.textContent).toContain("Medium");
			expect(container.textContent).toContain("Large");
		});

		it("renders radio inputs for single select group", () => {
			const { container } = render(
				<OptionGroup
					group={mockSingleSelectGroup}
					choices={mockChoices}
					selectedChoiceIds={["choice-1"]}
					quantitySelections={new Map()}
					onSelectionChange={vi.fn()}
					onQuantityChange={vi.fn()}
				/>,
				{ wrapper: createWrapper() },
			);

			const radios = container.querySelectorAll('input[type="radio"]');
			expect(radios).toHaveLength(3);
		});

		it("shows selected choice as checked", () => {
			render(
				<OptionGroup
					group={mockSingleSelectGroup}
					choices={mockChoices}
					selectedChoiceIds={["choice-2"]} // Medium selected
					quantitySelections={new Map()}
					onSelectionChange={vi.fn()}
					onQuantityChange={vi.fn()}
				/>,
				{ wrapper: createWrapper() },
			);

			const mediumRadio = screen.getByRole("radio", { name: /medium/i });
			expect(mediumRadio).toBeChecked();
		});

		it("calls onSelectionChange when clicking a choice", () => {
			const onSelectionChange = vi.fn();

			render(
				<OptionGroup
					group={mockSingleSelectGroup}
					choices={mockChoices}
					selectedChoiceIds={["choice-1"]}
					quantitySelections={new Map()}
					onSelectionChange={onSelectionChange}
					onQuantityChange={vi.fn()}
				/>,
				{ wrapper: createWrapper() },
			);

			const largeRadio = screen.getByRole("radio", { name: /large/i });
			fireEvent.click(largeRadio);

			expect(onSelectionChange).toHaveBeenCalledWith(["choice-3"]);
		});

		it("shows Required badge for required groups", () => {
			render(
				<OptionGroup
					group={mockSingleSelectGroup}
					choices={mockChoices}
					selectedChoiceIds={["choice-1"]}
					quantitySelections={new Map()}
					onSelectionChange={vi.fn()}
					onQuantityChange={vi.fn()}
				/>,
				{ wrapper: createWrapper() },
			);

			// The "Required" text comes from i18n translation
			expect(screen.getByText(/required/i)).toBeInTheDocument();
		});

		it("shows price modifier for choices with non-zero price", () => {
			render(
				<OptionGroup
					group={mockSingleSelectGroup}
					choices={mockChoices}
					selectedChoiceIds={["choice-1"]}
					quantitySelections={new Map()}
					onSelectionChange={vi.fn()}
					onQuantityChange={vi.fn()}
				/>,
				{ wrapper: createWrapper() },
			);

			// Medium has +2,00 €, Large has +4,00 € (German locale)
			expect(screen.getByText("+2,00 €")).toBeInTheDocument();
			expect(screen.getByText("+4,00 €")).toBeInTheDocument();
		});
	});

	describe("Multi Select (Checkbox)", () => {
		it("renders checkbox inputs for multi select group", () => {
			render(
				<OptionGroup
					group={mockMultiSelectGroup}
					choices={mockToppingChoices}
					selectedChoiceIds={[]}
					quantitySelections={new Map()}
					onSelectionChange={vi.fn()}
					onQuantityChange={vi.fn()}
				/>,
				{ wrapper: createWrapper() },
			);

			const checkboxes = screen.getAllByRole("checkbox");
			expect(checkboxes).toHaveLength(3);
		});

		it("shows selected choices as checked", () => {
			render(
				<OptionGroup
					group={mockMultiSelectGroup}
					choices={mockToppingChoices}
					selectedChoiceIds={["choice-4", "choice-5"]} // Cheese and Pepperoni selected
					quantitySelections={new Map()}
					onSelectionChange={vi.fn()}
					onQuantityChange={vi.fn()}
				/>,
			);

			const cheeseCheckbox = screen.getByRole("checkbox", {
				name: /extra cheese/i,
			});
			const pepperoniCheckbox = screen.getByRole("checkbox", {
				name: /pepperoni/i,
			});
			const mushroomsCheckbox = screen.getByRole("checkbox", {
				name: /mushrooms/i,
			});

			expect(cheeseCheckbox).toBeChecked();
			expect(pepperoniCheckbox).toBeChecked();
			expect(mushroomsCheckbox).not.toBeChecked();
		});

		it("calls onSelectionChange with added choice when checking", () => {
			const onSelectionChange = vi.fn();

			render(
				<OptionGroup
					group={mockMultiSelectGroup}
					choices={mockToppingChoices}
					selectedChoiceIds={["choice-4"]} // Cheese already selected
					quantitySelections={new Map()}
					onSelectionChange={onSelectionChange}
					onQuantityChange={vi.fn()}
				/>,
				{ wrapper: createWrapper() },
			);

			const pepperoniCheckbox = screen.getByRole("checkbox", {
				name: /pepperoni/i,
			});
			fireEvent.click(pepperoniCheckbox);

			expect(onSelectionChange).toHaveBeenCalledWith(["choice-4", "choice-5"]);
		});

		it("calls onSelectionChange with removed choice when unchecking", () => {
			const onSelectionChange = vi.fn();

			render(
				<OptionGroup
					group={mockMultiSelectGroup}
					choices={mockToppingChoices}
					selectedChoiceIds={["choice-4", "choice-5"]} // Cheese and Pepperoni selected
					quantitySelections={new Map()}
					onSelectionChange={onSelectionChange}
					onQuantityChange={vi.fn()}
				/>,
				{ wrapper: createWrapper() },
			);

			const cheeseCheckbox = screen.getByRole("checkbox", {
				name: /extra cheese/i,
			});
			fireEvent.click(cheeseCheckbox);

			expect(onSelectionChange).toHaveBeenCalledWith(["choice-5"]);
		});

		it("shows helper text for multi select constraints", () => {
			render(
				<OptionGroup
					group={mockMultiSelectGroup}
					choices={mockToppingChoices}
					selectedChoiceIds={[]}
					quantitySelections={new Map()}
					onSelectionChange={vi.fn()}
					onQuantityChange={vi.fn()}
				/>,
				{ wrapper: createWrapper() },
			);

			expect(screen.getByText(/select up to 3/i)).toBeInTheDocument();
		});
	});

	describe("Quantity Select", () => {
		const mockQuantityGroup = {
			id: "grp-3",
			name: "Pick Your Donuts",
			type: "quantity_select" as const,
			isRequired: true,
			minSelections: 0,
			maxSelections: null,
			numFreeOptions: 0,
			aggregateMinQuantity: 3,
			aggregateMaxQuantity: 6,
		};

		const mockDonutChoices = [
			{
				id: "choice-7",
				name: "Glazed",
				priceModifier: 100,
				displayOrder: 1,
				isDefault: false,
				isAvailable: true,
				minQuantity: 0,
				maxQuantity: 3,
			},
			{
				id: "choice-8",
				name: "Chocolate",
				priceModifier: 150,
				displayOrder: 2,
				isDefault: false,
				isAvailable: true,
				minQuantity: 0,
				maxQuantity: 3,
			},
		];

		it("renders quantity steppers for quantity select group", () => {
			render(
				<OptionGroup
					group={mockQuantityGroup}
					choices={mockDonutChoices}
					selectedChoiceIds={[]}
					quantitySelections={new Map()}
					onSelectionChange={vi.fn()}
					onQuantityChange={vi.fn()}
				/>,
				{ wrapper: createWrapper() },
			);

			// Should have increase/decrease buttons for each choice
			const buttons = screen.getAllByRole("button");
			expect(buttons.length).toBeGreaterThanOrEqual(4); // 2 choices x 2 buttons
		});

		it("shows aggregate quantity constraints in helper text", () => {
			render(
				<OptionGroup
					group={mockQuantityGroup}
					choices={mockDonutChoices}
					selectedChoiceIds={[]}
					quantitySelections={new Map()}
					onSelectionChange={vi.fn()}
					onQuantityChange={vi.fn()}
				/>,
				{ wrapper: createWrapper() },
			);

			expect(screen.getByText(/select 3-6/i)).toBeInTheDocument();
		});

		it("calls onQuantityChange when incrementing", () => {
			const onQuantityChange = vi.fn();

			render(
				<OptionGroup
					group={mockQuantityGroup}
					choices={mockDonutChoices}
					selectedChoiceIds={[]}
					quantitySelections={new Map()}
					onSelectionChange={vi.fn()}
					onQuantityChange={onQuantityChange}
				/>,
				{ wrapper: createWrapper() },
			);

			const increaseButtons = screen.getAllByRole("button", {
				name: /increase/i,
			});
			fireEvent.click(increaseButtons[0]);

			expect(onQuantityChange).toHaveBeenCalledWith("choice-7", 1);
		});
	});
});
