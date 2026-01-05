"use client";

import { AlertTriangle, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useCartStore } from "../../cart";
import type { MenuItemWithDefaults } from "../../schemas";
import { QuantityStepper } from "../../shared";
import { ShopButton, ShopHeading } from "../../shared/components/ui";
import { formatPrice } from "../../utils";
import { OptionGroup } from "./option-group";

interface ItemDrawerProps {
	item: MenuItemWithDefaults | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	storeId: number;
	storeSlug: string;
	isOpen: boolean;
}

/**
 * Calculate total price for a group with free options.
 * The cheapest N options are free (where N = numFreeOptions).
 */
function calculateGroupPrice(
	group: MenuItemWithDefaults["optionGroups"][0],
	selectedChoiceIds: number[],
	quantitySelections: Map<number, number>,
): number {
	// For quantity_select groups
	if (group.type === "quantity_select") {
		// Build list of all selected items with their prices
		const priceItems: number[] = [];
		for (const choice of group.choices) {
			const qty = quantitySelections.get(choice.id) ?? 0;
			for (let i = 0; i < qty; i++) {
				priceItems.push(choice.priceModifier);
			}
		}

		// Sort by price ascending (cheapest first)
		priceItems.sort((a, b) => a - b);

		// First N are free
		const numFree = Math.min(group.numFreeOptions, priceItems.length);
		return priceItems.slice(numFree).reduce((sum, p) => sum + p, 0);
	}

	// For single/multi select groups
	const selectedChoices = group.choices.filter((c) =>
		selectedChoiceIds.includes(c.id),
	);

	if (group.numFreeOptions === 0 || selectedChoices.length === 0) {
		// No free options, just sum all price modifiers
		return selectedChoices.reduce((sum, c) => sum + c.priceModifier, 0);
	}

	// Sort by price ascending (cheapest first for free)
	const prices = selectedChoices
		.map((c) => c.priceModifier)
		.sort((a, b) => a - b);
	const numFree = Math.min(group.numFreeOptions, prices.length);
	return prices.slice(numFree).reduce((sum, p) => sum + p, 0);
}

/**
 * Build the initial selections from defaults.
 */
function buildInitialSelections(
	item: MenuItemWithDefaults,
): Map<number, number[]> {
	const defaults = new Map<number, number[]>();

	for (const group of item.optionGroups) {
		if (group.type === "quantity_select") {
			// For quantity_select, we don't set IDs here (quantities handled separately)
			// But if required, we may need to set some defaults later
			defaults.set(group.id, []);
		} else {
			// Single/multi select: get default choice IDs
			const defaultIds = group.choices
				.filter((c) => c.isDefault && c.isAvailable)
				.map((c) => c.id);

			// For required single select with no defaults, select first available
			if (
				group.type === "single_select" &&
				group.isRequired &&
				defaultIds.length === 0
			) {
				const firstAvailable = group.choices.find((c) => c.isAvailable);
				if (firstAvailable) {
					defaults.set(group.id, [firstAvailable.id]);
				} else {
					defaults.set(group.id, []);
				}
			} else if (defaultIds.length > 0 || group.isRequired) {
				defaults.set(group.id, defaultIds);
			}
		}
	}

	return defaults;
}

/**
 * Build initial quantity selections from defaults.
 */
function buildInitialQuantities(
	item: MenuItemWithDefaults,
): Map<number, Map<number, number>> {
	const quantities = new Map<number, Map<number, number>>();

	for (const group of item.optionGroups) {
		if (group.type === "quantity_select") {
			const groupQuantities = new Map<number, number>();
			for (const choice of group.choices) {
				// If choice has isDefault, set initial quantity to minQuantity or 1
				if (choice.isDefault && choice.isAvailable) {
					groupQuantities.set(choice.id, Math.max(1, choice.minQuantity));
				} else {
					groupQuantities.set(choice.id, choice.minQuantity);
				}
			}
			quantities.set(group.id, groupQuantities);
		}
	}

	return quantities;
}

export function ItemDrawer({
	item,
	open,
	onOpenChange,
	storeId,
	storeSlug,
	isOpen: isStoreOpen,
}: ItemDrawerProps) {
	const { t } = useTranslation("shop");
	const addItem = useCartStore((s) => s.addItem);
	const [quantity, setQuantity] = useState(1);
	const [selectedOptions, setSelectedOptions] = useState<Map<number, number[]>>(
		new Map(),
	);
	const [quantitySelections, setQuantitySelections] = useState<
		Map<number, Map<number, number>>
	>(new Map());

	useEffect(() => {
		if (item) {
			setSelectedOptions(buildInitialSelections(item));
			setQuantitySelections(buildInitialQuantities(item));
			setQuantity(1);
		}
	}, [item]);

	const calculateTotal = useMemo(() => {
		if (!item) return 0;
		let total = item.price;

		for (const group of item.optionGroups) {
			const choiceIds = selectedOptions.get(group.id) ?? [];
			const quantities = quantitySelections.get(group.id) ?? new Map();
			total += calculateGroupPrice(group, choiceIds, quantities);
		}

		return total * quantity;
	}, [item, selectedOptions, quantitySelections, quantity]);

	const isValid = useMemo(() => {
		if (!item) return false;

		return item.optionGroups.every((group) => {
			if (group.type === "quantity_select") {
				// Check aggregate quantity constraints
				const quantities = quantitySelections.get(group.id) ?? new Map();
				const totalQty = Array.from(quantities.values()).reduce(
					(sum, qty) => sum + qty,
					0,
				);

				if (group.isRequired || group.aggregateMinQuantity !== null) {
					const minRequired = group.aggregateMinQuantity ?? 1;
					if (totalQty < minRequired) return false;
				}

				if (group.aggregateMaxQuantity !== null) {
					if (totalQty > group.aggregateMaxQuantity) return false;
				}

				return true;
			}

			// Single/multi select validation
			if (!group.isRequired) return true;
			const selected = selectedOptions.get(group.id) ?? [];
			return selected.length >= group.minSelections;
		});
	}, [item, selectedOptions, quantitySelections]);

	const handleAddToCart = () => {
		if (!item || !isValid) return;

		const selectedOptionsArray = item.optionGroups.map((group) => {
			if (group.type === "quantity_select") {
				// For quantity select, convert quantities to choices with quantity
				const quantities = quantitySelections.get(group.id) ?? new Map();
				const choices: {
					id: number;
					name: string;
					price: number;
					quantity: number;
				}[] = [];

				for (const [choiceId, qty] of quantities) {
					if (qty > 0) {
						const choice = group.choices.find((c) => c.id === choiceId);
						if (choice) {
							choices.push({
								id: choice.id,
								name: choice.name,
								price: choice.priceModifier,
								quantity: qty,
							});
						}
					}
				}

				return {
					groupId: group.id,
					groupName: group.name,
					choices,
				};
			}

			// Single/multi select
			const choiceIds = selectedOptions.get(group.id) ?? [];
			return {
				groupId: group.id,
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
		});

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

	const handleQuantityChange = (
		groupId: number,
		choiceId: number,
		qty: number,
	) => {
		setQuantitySelections((prev) => {
			const newMap = new Map(prev);
			const groupMap = new Map(newMap.get(groupId) ?? new Map());
			groupMap.set(choiceId, Math.max(0, qty));
			newMap.set(groupId, groupMap);
			return newMap;
		});
	};

	if (!item) return null;

	const hasAllergens = item.allergens && item.allergens.length > 0;
	const hasOptions = item.optionGroups.length > 0;

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent
				className="max-h-[85dvh] overflow-hidden md:max-w-lg md:mx-auto md:rounded-t-(--radius)"
				hideHandle
			>
				{/* Handle */}
				<div className="mx-auto mt-4 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/40" />
				{/* Scrollable content */}
				<div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
					{/* Hero image - full width, edge to edge */}
					{item.imageUrl && (
						<div className="relative h-48 md:h-56 overflow-hidden">
							<img
								src={item.imageUrl}
								alt={item.name}
								className="w-full h-full object-cover"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
						</div>
					)}

					{/* Content area */}
					<div
						className={cn(
							"relative px-5 pb-4",
							item.imageUrl ? "-mt-8" : "pt-4",
						)}
					>
						{/* Title */}
						<DrawerTitle asChild>
							<ShopHeading as="h2" size="2xl" className="leading-tight mb-2">
								{item.name}
							</ShopHeading>
						</DrawerTitle>

						{/* Description */}
						{item.description && (
							<DrawerDescription className="text-muted-foreground text-base leading-relaxed mb-4">
								{item.description}
							</DrawerDescription>
						)}

						{/* Allergens - subtle inline style */}
						{hasAllergens && (
							<div className="flex items-center gap-2 py-3 border-y border-border/40 mb-4">
								<AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
								<span className="text-sm text-muted-foreground">
									{t("menu.contains")}:{" "}
									<span className="text-foreground">
										{item.allergens?.join(", ")}
									</span>
								</span>
							</div>
						)}

						{/* Option Groups */}
						{hasOptions && (
							<div className="space-y-1 pb-4">
								{item.optionGroups.map((group) => (
									<OptionGroup
										key={group.id}
										group={group}
										choices={group.choices}
										selectedChoiceIds={selectedOptions.get(group.id) ?? []}
										quantitySelections={
											quantitySelections.get(group.id) ?? new Map()
										}
										onSelectionChange={(ids) =>
											handleOptionChange(group.id, ids)
										}
										onQuantityChange={(choiceId, qty) =>
											handleQuantityChange(group.id, choiceId, qty)
										}
									/>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Sticky footer with shadow */}
				<div className="relative border-t border-border bg-card px-5 py-4 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]">
					<div className="flex items-center gap-4">
						<QuantityStepper value={quantity} onChange={setQuantity} />
						<ShopButton
							variant="primary"
							size="lg"
							onClick={handleAddToCart}
							disabled={!isValid || !isStoreOpen}
							className="flex-1 h-14 text-base font-medium shadow-lg shadow-primary/20"
						>
							{/* Mobile: icon + price only */}
							<span className="flex items-center gap-2 md:hidden">
								<Plus className="w-5 h-5" />
								{formatPrice(calculateTotal)}
							</span>
							{/* Desktop: text + price */}
							<span className="hidden md:inline">
								{t("menu.addToOrder")} · {formatPrice(calculateTotal)}
							</span>
						</ShopButton>
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
