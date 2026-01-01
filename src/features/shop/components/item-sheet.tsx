"use client";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCart } from "../cart-context";
import { formatPrice } from "../utils";
import { OptionGroup } from "./option-group";
import { QuantityStepper } from "./quantity-stepper";

interface Choice {
	id: number;
	name: string;
	priceModifier: number;
	isDefault: boolean;
}

interface OptionGroupData {
	id: number;
	name: string;
	isRequired: boolean;
	minSelections: number;
	maxSelections: number | null; // null = unlimited
	choices: Choice[];
}

interface ItemWithOptions {
	id: number;
	name: string;
	description: string | null;
	price: number;
	imageUrl: string | null;
	allergens: string[] | null;
	optionGroups: OptionGroupData[];
}

interface ItemSheetProps {
	item: ItemWithOptions | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	storeId: number;
	storeSlug: string;
}

export function ItemSheet({
	item,
	open,
	onOpenChange,
	storeId,
	storeSlug,
}: ItemSheetProps) {
	const { addItem } = useCart();
	const [quantity, setQuantity] = useState(1);
	const [selectedOptions, setSelectedOptions] = useState<Map<number, number[]>>(
		new Map(),
	);

	// Initialize defaults when item changes
	useEffect(() => {
		if (item) {
			const defaults = new Map<number, number[]>();
			for (const group of item.optionGroups) {
				const defaultIds = group.choices
					.filter((c) => c.isDefault)
					.map((c) => c.id);
				// Set defaults if they exist, or if the group is required with single select
				if (
					defaultIds.length > 0 ||
					(group.isRequired &&
						group.minSelections === 1 &&
						group.maxSelections === 1 &&
						group.choices.length > 0)
				) {
					// If no defaults but required single-select, use first choice
					defaults.set(
						group.id,
						defaultIds.length > 0 ? defaultIds : [group.choices[0].id],
					);
				} else if (group.isRequired) {
					defaults.set(group.id, defaultIds);
				}
			}
			setSelectedOptions(defaults);
			setQuantity(1);
		}
	}, [item]);

	// Calculate total price including option modifiers
	const calculateTotal = useMemo(() => {
		if (!item) return 0;

		let total = item.price;

		for (const [groupId, choiceIds] of selectedOptions) {
			const group = item.optionGroups.find((g) => g.id === groupId);
			if (group) {
				for (const choiceId of choiceIds) {
					const choice = group.choices.find((c) => c.id === choiceId);
					if (choice) total += choice.priceModifier;
				}
			}
		}

		return total * quantity;
	}, [item, selectedOptions, quantity]);

	// Validate required option groups have minimum selections
	const isValid = useMemo(() => {
		if (!item) return false;

		return item.optionGroups.every((group) => {
			if (!group.isRequired) return true;
			const selected = selectedOptions.get(group.id) ?? [];
			return selected.length >= group.minSelections;
		});
	}, [item, selectedOptions]);

	const handleAddToCart = () => {
		if (!item || !isValid) return;

		// Build selected options array for the cart
		const selectedOptionsArray = Array.from(selectedOptions.entries()).map(
			([groupId, choiceIds]) => {
				const group = item.optionGroups.find((g) => g.id === groupId);
				if (!group) {
					return {
						groupId,
						groupName: "",
						choices: [],
					};
				}
				return {
					groupId,
					groupName: group.name,
					choices: choiceIds.map((choiceId) => {
						const choice = group.choices.find((c) => c.id === choiceId);
						if (!choice) {
							return { id: choiceId, name: "", price: 0 };
						}
						return {
							id: choice.id,
							name: choice.name,
							price: choice.priceModifier,
						};
					}),
				};
			},
		);

		addItem({
			itemId: item.id,
			name: item.name,
			basePrice: item.price,
			imageUrl: item.imageUrl ?? undefined,
			quantity,
			selectedOptions: selectedOptionsArray,
			storeId,
			storeSlug,
		});

		onOpenChange(false);
	};

	const handleOptionChange = (groupId: number, choiceIds: number[]) => {
		setSelectedOptions((prev) => new Map(prev).set(groupId, choiceIds));
	};

	if (!item) return null;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="bottom"
				className="h-[85vh] rounded-t-3xl p-0 shop flex flex-col"
			>
				<VisuallyHidden.Root>
					<SheetTitle>{item.name}</SheetTitle>
				</VisuallyHidden.Root>

				{/* Scrollable content */}
				<div className="flex-1 overflow-y-auto">
					{/* Image */}
					<div className="aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-50 relative">
						{item.imageUrl && (
							<img
								src={item.imageUrl}
								alt={item.name}
								className="w-full h-full object-cover"
							/>
						)}
						{/* Drag handle indicator */}
						<div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-shop-foreground/20 rounded-full" />
					</div>

					{/* Content */}
					<div className="p-5">
						{/* Header */}
						<div className="flex items-start justify-between gap-4">
							<h2
								style={{ fontFamily: "var(--font-heading)" }}
								className="text-2xl text-shop-foreground"
							>
								{item.name}
							</h2>
							<span className="text-lg font-medium text-shop-foreground whitespace-nowrap">
								{formatPrice(item.price)}
							</span>
						</div>

						{/* Description */}
						{item.description && (
							<p className="mt-2 text-shop-foreground-muted leading-relaxed">
								{item.description}
							</p>
						)}

						{/* Allergens */}
						{item.allergens && item.allergens.length > 0 && (
							<div className="flex flex-wrap gap-1.5 mt-3">
								{item.allergens.map((allergen) => (
									<span
										key={allergen}
										className="text-xs px-2 py-1 bg-shop-background-subtle text-shop-foreground-muted rounded-full"
									>
										{allergen}
									</span>
								))}
							</div>
						)}

						{/* Option Groups */}
						{item.optionGroups.length > 0 && (
							<div className="mt-4">
								{item.optionGroups.map((group) => (
									<OptionGroup
										key={group.id}
										group={group}
										choices={group.choices}
										selectedChoiceIds={selectedOptions.get(group.id) ?? []}
										onSelectionChange={(ids) =>
											handleOptionChange(group.id, ids)
										}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Sticky footer */}
				<div className="p-4 border-t border-shop-border bg-shop-card">
					<div className="flex items-center justify-between gap-4">
						<QuantityStepper value={quantity} onChange={setQuantity} />
						<button
							type="button"
							onClick={handleAddToCart}
							disabled={!isValid}
							className={cn(
								"flex-1 py-3.5 bg-shop-accent text-shop-accent-foreground rounded-xl font-medium text-lg",
								"transition-colors hover:bg-shop-accent-hover",
								"focus:outline-none focus-visible:ring-2 focus-visible:ring-shop-accent focus-visible:ring-offset-2",
								!isValid && "opacity-50 cursor-not-allowed",
							)}
						>
							<span className="transition-all duration-200">
								Add · {formatPrice(calculateTotal)}
							</span>
						</button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
