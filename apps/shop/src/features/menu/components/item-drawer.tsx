import {
	Box,
	CloseButton,
	Drawer,
	Flex,
	HStack,
	Image,
	Portal,
	Spinner,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPlus, LuTriangleAlert } from "react-icons/lu";
import {
	OptionGroup,
	QuantityStepper,
	ShopButton,
	ShopHeading,
	ShopMutedText,
} from "@/features";
import { useTRPC } from "../../../lib/trpc";
import { useCartStore } from "../../cart";
import { formatPrice } from "../../utils";
import { menuQueryDefaults, resolveMenuLanguageCode } from "../queries";
import type {
	MenuItemChoice,
	MenuItemLight,
	MenuItemOptionGroup,
} from "../types";

interface ItemDrawerProps {
	item: MenuItemLight;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	storeId: string;
	storeSlug: string;
	isOpen: boolean;
}

/**
 * Calculate total price for a group with free options.
 * The cheapest N options are free (where N = numFreeOptions).
 */
function calculateGroupPrice(
	group: MenuItemOptionGroup,
	selectedChoiceIds: string[],
	quantitySelections: Map<string, number>,
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
		const numFree = Math.min(group.numFreeOptions ?? 0, priceItems.length);
		return priceItems.slice(numFree).reduce((sum, p) => sum + p, 0);
	}

	// For single/multi select groups
	const selectedChoices = group.choices.filter((choice: MenuItemChoice) =>
		selectedChoiceIds.includes(choice.id),
	);

	if (group.numFreeOptions === 0 || selectedChoices.length === 0) {
		// No free options, just sum all price modifiers
		return selectedChoices.reduce(
			(sum: number, choice: MenuItemChoice) => sum + choice.priceModifier,
			0,
		);
	}

	// Sort by price ascending (cheapest first for free)
	const prices = selectedChoices
		.map((choice: MenuItemChoice) => choice.priceModifier)
		.sort((a: number, b: number) => a - b);
	const numFree = Math.min(group.numFreeOptions ?? 0, prices.length);
	return prices.slice(numFree).reduce((sum: number, price: number) => {
		return sum + price;
	}, 0);
}

/**
 * Build the initial selections from defaults.
 */
function buildInitialSelections(
	optionGroups: MenuItemOptionGroup[],
): Map<string, string[]> {
	const defaults = new Map<string, string[]>();

	for (const group of optionGroups) {
		if (group.type === "quantity_select") {
			// For quantity_select, we don't set IDs here (quantities handled separately)
			// But if required, we may need to set some defaults later
			defaults.set(group.id, []);
		} else {
			// Single/multi select: get default choice IDs
			const defaultIds = group.choices
				.filter(
					(choice: MenuItemChoice) => choice.isDefault && choice.isAvailable,
				)
				.map((choice: MenuItemChoice) => choice.id);

			// For required single select with no defaults, select first available
			if (
				group.type === "single_select" &&
				group.isRequired &&
				defaultIds.length === 0
			) {
				const firstAvailable = group.choices.find(
					(choice: MenuItemChoice) => choice.isAvailable,
				);
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
	optionGroups: MenuItemOptionGroup[],
): Map<string, Map<string, number>> {
	const quantities = new Map<string, Map<string, number>>();

	for (const group of optionGroups) {
		if (group.type === "quantity_select") {
			const groupQuantities = new Map<string, number>();
			for (const choice of group.choices) {
				// If choice has isDefault, set initial quantity to minQuantity or 1
				if (choice.isDefault && choice.isAvailable) {
					groupQuantities.set(choice.id, Math.max(1, choice.minQuantity ?? 0));
				} else {
					groupQuantities.set(choice.id, choice.minQuantity ?? 0);
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
	// Early return if item is null
	if (!item) {
		return null;
	}

	const { t } = useTranslation("shop");
	const addItem = useCartStore((s) => s.addItem);
	const [quantity, setQuantity] = useState(1);
	const [selectedOptions, setSelectedOptions] = useState<Map<string, string[]>>(
		new Map(),
	);
	const [quantitySelections, setQuantitySelections] = useState<
		Map<string, Map<string, number>>
	>(new Map());

	// Fetch option groups on demand (only when drawer is open AND item has options)
	const shouldFetchOptions = Boolean(open && item.hasOptionGroups);
	const trpc = useTRPC();
	const { i18n } = useTranslation();
	const languageCode = resolveMenuLanguageCode(
		i18n.resolvedLanguage ?? i18n.language,
	);
	const { data: optionsData, isLoading: isLoadingOptions } = useQuery({
		...trpc.menu.shop.getItemDetails.queryOptions({
			itemId: item.id,
			languageCode,
		}),
		staleTime: menuQueryDefaults.staleTimeMs,
		enabled: shouldFetchOptions,
	});

	// Get option groups from fetched data (or empty array for items without options)
	const optionGroups: MenuItemOptionGroup[] = useMemo(() => {
		if (!item.hasOptionGroups) return [];
		return (optionsData?.optionGroups ?? []) as MenuItemOptionGroup[];
	}, [item.hasOptionGroups, optionsData]);

	// Reset selections when item changes or options are loaded
	useEffect(() => {
		if (item && optionGroups.length > 0) {
			setSelectedOptions(buildInitialSelections(optionGroups));
			setQuantitySelections(buildInitialQuantities(optionGroups));
		}
		if (item) {
			setQuantity(1);
		}
	}, [item, optionGroups]);

	// Clear selections when drawer closes
	useEffect(() => {
		if (!open) {
			setSelectedOptions(new Map());
			setQuantitySelections(new Map());
		}
	}, [open]);

	// Move focus to drawer when it opens (fixes aria-hidden accessibility issue)
	// This ensures focus is inside the drawer when Chakra sets aria-hidden on root
	useEffect(() => {
		if (open) {
			// Small delay to ensure drawer is fully rendered in DOM
			const timeoutId = setTimeout(() => {
				// Find the drawer content element
				const drawerContent = document.querySelector(
					'[data-scope="drawer"][data-part="content"]',
				) as HTMLElement;
				if (drawerContent) {
					// Find first focusable element in drawer
					const firstFocusable = drawerContent.querySelector(
						'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
					) as HTMLElement;
					firstFocusable?.focus();
				}
			}, 150);
			return () => clearTimeout(timeoutId);
		}
	}, [open]);

	const calculateTotal = useMemo(() => {
		let total = item.price;

		for (const group of optionGroups) {
			const choiceIds = selectedOptions.get(group.id) ?? [];
			const quantities = quantitySelections.get(group.id) ?? new Map();
			total += calculateGroupPrice(
				group as MenuItemOptionGroup,
				choiceIds,
				quantities,
			);
		}

		return total * quantity;
	}, [item, optionGroups, selectedOptions, quantitySelections, quantity]);

	const isValid = useMemo(() => {
		// If item has no options, it's always valid
		if (!item.hasOptionGroups) return true;
		// If still loading options, not valid yet
		if (isLoadingOptions) return false;

		return optionGroups.every((group: MenuItemOptionGroup) => {
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
			return selected.length >= (group.minSelections ?? 0);
		});
	}, [
		item,
		optionGroups,
		selectedOptions,
		quantitySelections,
		isLoadingOptions,
	]);

	const handleAddToCart = () => {
		if (!isValid) return;

		const selectedOptionsArray = optionGroups.map(
			(group: MenuItemOptionGroup) => {
				if (group.type === "quantity_select") {
					// For quantity select, convert quantities to choices with quantity
					const quantities = quantitySelections.get(group.id) ?? new Map();
					const choices: {
						id: string;
						name: string;
						price: number;
						quantity: number;
					}[] = [];

					for (const [choiceId, qty] of quantities) {
						if (qty > 0) {
							const choice = group.choices.find(
								(c: MenuItemChoice) => c.id === choiceId,
							);
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
						const choice = group.choices.find(
							(c: MenuItemChoice) => c.id === choiceId,
						);
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
			kitchenName: undefined,
			basePrice: item.price,
			imageUrl: item.imageUrl ?? undefined,
			quantity,
			selectedOptions: selectedOptionsArray,
			storeId,
			storeSlug,
		});

		onOpenChange(false);
	};

	const handleOptionChange = (groupId: string, choiceIds: string[]) => {
		setSelectedOptions((prev) => new Map(prev).set(groupId, choiceIds));
	};

	const handleQuantityChange = (
		groupId: string,
		choiceId: string,
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

	const hasAllergens = item.allergens && item.allergens.length > 0;
	const hasOptions = item.hasOptionGroups;
	const showOptionsLoading = hasOptions && isLoadingOptions;

	return (
		<Drawer.Root
			open={open}
			onOpenChange={(e) => onOpenChange(e.open)}
			placement="bottom"
		>
			<Portal>
				<Drawer.Backdrop />
				<Drawer.Positioner>
					<Drawer.Content
						maxH="90dvh"
						minH="75dvh"
						roundedTop="xl"
						overflow="hidden"
						maxW={{ md: "lg" }}
						mx={{ md: "auto" }}
					>
						{/* Handle */}
						<Flex justify="center" pt="4" pb="2">
							<Box h="1" w="10" rounded="full" bg="border" />
						</Flex>

						{/* Close button */}
						<Drawer.CloseTrigger asChild position="absolute" top="3" right="3">
							<CloseButton size="sm" />
						</Drawer.CloseTrigger>

						{/* Scrollable content */}
						<Drawer.Body
							display="flex"
							flexDir="column"
							flex="1"
							minH="0"
							overflowY="auto"
							overscrollBehavior="contain"
							px="0"
							pb="0"
						>
							{/* Hero image - full width, edge to edge */}
							{item.imageUrl && (
								<Box
									position="relative"
									h={{ base: "56", md: "64" }}
									overflow="hidden"
								>
									<Image
										src={item.imageUrl}
										alt={item.name}
										h="full"
										w="full"
										objectFit="cover"
									/>
									<Box
										position="absolute"
										inset="0"
										bgGradient="to-t"
										gradientFrom="bg.panel"
										gradientVia="transparent"
										gradientTo="transparent"
									/>
								</Box>
							)}

							{/* Content area */}
							<Box
								position="relative"
								px="6"
								pb="4"
								mt={item.imageUrl ? "-8" : "0"}
								pt={item.imageUrl ? "0" : "8"}
							>
								{/* Title */}
								<Drawer.Title asChild>
									<ShopHeading
										as="h2"
										size="2xl"
										lineHeight="tight"
										letterSpacing="tight"
										mb="3"
									>
										{item.name}
									</ShopHeading>
								</Drawer.Title>

								{/* Description */}
								{item.description && (
									<Drawer.Description asChild>
										<ShopMutedText fontSize="17px" lineHeight="relaxed" mb="5">
											{item.description}
										</ShopMutedText>
									</Drawer.Description>
								)}

								{/* Allergens - subtle inline style */}
								{hasAllergens && (
									<HStack
										gap="2"
										borderY="1px"
										borderColor="border.muted"
										py="3"
										mb="5"
									>
										<Box
											as={LuTriangleAlert}
											boxSize="4"
											flexShrink={0}
											color="orange.500"
										/>
										<Text color="fg.muted" fontSize="sm">
											{t("menu.contains")}:{" "}
											<Text as="span" color="fg">
												{item.allergens
													?.map((allergen: string) =>
														String(t(`menu:allergens.${allergen}`, allergen)),
													)
													.join(", ")}
											</Text>
										</Text>
									</HStack>
								)}

								{/* Option Groups */}
								{hasOptions && (
									<Stack gap="1" pb="4">
										{showOptionsLoading ? (
											<Flex align="center" justify="center" py="8">
												<Spinner size="md" color="fg.muted" />
											</Flex>
										) : (
											optionGroups.map((group: MenuItemOptionGroup) => (
												<OptionGroup
													key={group.id}
													group={group}
													choices={group.choices}
													selectedChoiceIds={
														selectedOptions.get(group.id) ?? []
													}
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
											))
										)}
									</Stack>
								)}
							</Box>

							{/* Spacer - pushes footer down when content is minimal */}
							<Box minH="8" flex="1" />
						</Drawer.Body>

						{/* Sticky footer with shadow */}
						<Drawer.Footer
							position="relative"
							borderTop="1px"
							borderColor="border"
							bg="bg.panel"
							px="6"
							py="5"
							shadow="0 -4px 20px -4px rgba(0,0,0,0.08)"
						>
							<HStack gap="4" w="full">
								<QuantityStepper value={quantity} onChange={setQuantity} />
								<ShopButton
									variant="primary"
									size="lg"
									onClick={handleAddToCart}
									disabled={!isValid || !isStoreOpen}
									h="14"
									flex="1"
									fontWeight="medium"
									fontSize="md"
									shadow="lg"
									_active={{ transform: "scale(0.98)" }}
								>
									{/* Mobile: icon + price only */}
									<HStack gap="2" display={{ base: "flex", md: "none" }}>
										<LuPlus />
										{formatPrice(calculateTotal)}
									</HStack>
									{/* Desktop: text + price */}
									<Text display={{ base: "none", md: "inline" }}>
										{t("menu.addToOrder")} · {formatPrice(calculateTotal)}
									</Text>
								</ShopButton>
							</HStack>
						</Drawer.Footer>
					</Drawer.Content>
				</Drawer.Positioner>
			</Portal>
		</Drawer.Root>
	);
}
