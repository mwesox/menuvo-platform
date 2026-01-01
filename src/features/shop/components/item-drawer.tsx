"use client";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useCart } from "../cart-context";
import { OptionGroup } from "./option-group";
import { QuantityStepper } from "./quantity-stepper";
import {
	ShopBadge,
	ShopButton,
	ShopHeading,
	ShopMutedText,
	ShopPrice,
} from "./ui";

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

interface ItemDrawerProps {
	item: ItemWithOptions | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	storeId: number;
	storeSlug: string;
}

export function ItemDrawer({
	item,
	open,
	onOpenChange,
	storeId,
	storeSlug,
}: ItemDrawerProps) {
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
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent>
				<VisuallyHidden.Root>
					<DrawerTitle>{item.name}</DrawerTitle>
				</VisuallyHidden.Root>

				{/* Scrollable content */}
				<div className="overflow-y-auto">
					{/* Image */}
					<div className="aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-50 relative">
						{item.imageUrl && (
							<img
								src={item.imageUrl}
								alt={item.name}
								className="w-full h-full object-cover"
							/>
						)}
					</div>

					{/* Content */}
					<div className="p-5">
						{/* Header */}
						<div className="flex items-start justify-between gap-4">
							<ShopHeading as="h2" size="xl">
								{item.name}
							</ShopHeading>
							<ShopPrice
								cents={item.price}
								size="lg"
								className="whitespace-nowrap"
							/>
						</div>

						{/* Description */}
						{item.description && (
							<ShopMutedText className="mt-2 leading-relaxed">
								{item.description}
							</ShopMutedText>
						)}

						{/* Allergens */}
						{item.allergens && item.allergens.length > 0 && (
							<div className="flex flex-wrap gap-1.5 mt-3">
								{item.allergens.map((allergen) => (
									<ShopBadge key={allergen} variant="allergen">
										{allergen}
									</ShopBadge>
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
				<div className="p-4 border-t border-border bg-card">
					<div className="flex items-center justify-between gap-4">
						<QuantityStepper value={quantity} onChange={setQuantity} />
						<ShopButton
							variant="primary"
							size="lg"
							onClick={handleAddToCart}
							disabled={!isValid}
							className={cn(
								"flex-1 py-3.5 rounded-xl text-lg",
								!isValid && "opacity-50 cursor-not-allowed",
							)}
						>
							Add · <ShopPrice cents={calculateTotal} className="inline" />
						</ShopButton>
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
