import {
	Box,
	Center,
	Field,
	Flex,
	Grid,
	Input,
	Spinner,
	Stack,
	Textarea,
	VStack,
} from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import i18n from "i18next";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { MerchantCapabilities } from "../../../lib/capabilities";
import type { TrpcClient } from "../../../lib/trpc";
import { useCartStore } from "../../cart/stores/cart-store";
import { StoreUnavailable } from "../../shared/components/store-unavailable";
import {
	CardSection,
	PageContainer,
	ShopButton,
	ShopCard,
	ShopHeading,
	ShopMutedText,
	ShopPrice,
	ShopPriceRow,
	ShopText,
} from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/date-formatting";
import { useCreateOrder, useCreatePayment } from "../queries";
import { PickupTimeSelector } from "./pickup-time-selector";
import { RecommendationsSection } from "./recommendations-section";

type CreateOrderInput = Parameters<TrpcClient["order"]["create"]["mutate"]>[0];
type OrderType = CreateOrderInput["orderType"];

type RouterOutput = inferRouterOutputs<AppRouter>;
type MenuResponse = RouterOutput["menu"]["shop"]["getMenu"];
type EnabledOrderTypes = NonNullable<
	MenuResponse["store"]["enabledOrderTypes"]
>;

interface OrderingPageProps {
	storeId: string;
	storeSlug: string;
	capabilities: MerchantCapabilities;
	storeStatus?: {
		isOpen: boolean;
		nextOpenTime: string | null;
	};
	enabledOrderTypes: EnabledOrderTypes;
}

export function OrderingPage({
	storeId,
	storeSlug,
	capabilities,
	storeStatus,
	enabledOrderTypes,
}: OrderingPageProps) {
	const { t } = useTranslation("shop");

	// Cart state - compute subtotal from items (getters don't work with persist)
	const items = useCartStore((s) => s.items);
	const clearCart = useCartStore((s) => s.clearCart);
	const addItem = useCartStore((s) => s.addItem);

	// Determine if shop is closed
	const isClosed = storeStatus ? !storeStatus.isOpen : false;

	// Build list of available order types based on enabled settings
	const availableOrderTypes = [
		...(enabledOrderTypes.dine_in && !isClosed
			? [
					{
						value: "dine_in" as const,
						label: t("ordering.orderTypes.dineIn"),
						disabled: false,
					},
				]
			: []),
		...(enabledOrderTypes.takeaway
			? [
					{
						value: "takeaway" as const,
						label: t("ordering.orderTypes.takeaway"),
						disabled: false,
					},
				]
			: []),
		...(enabledOrderTypes.delivery
			? [
					{
						value: "delivery" as const,
						label: t("ordering.orderTypes.delivery"),
						disabled: false,
					},
				]
			: []),
	];

	// Get default order type: first available, fallback to takeaway
	const getDefaultOrderType = (): OrderType => {
		if (isClosed) {
			// When closed, prefer takeaway if enabled, then delivery
			if (enabledOrderTypes.takeaway) return "takeaway";
			if (enabledOrderTypes.delivery) return "delivery";
		} else {
			// When open, prefer dine_in if enabled
			if (enabledOrderTypes.dine_in) return "dine_in";
			if (enabledOrderTypes.takeaway) return "takeaway";
			if (enabledOrderTypes.delivery) return "delivery";
		}
		return "takeaway"; // Fallback
	};

	// Form state
	const [customerName, setCustomerName] = useState("");
	const [customerNotes, setCustomerNotes] = useState("");
	const [orderType, setOrderType] = useState<OrderType>(getDefaultOrderType());
	const [scheduledPickupTime, setScheduledPickupTime] = useState<string | null>(
		null,
	);

	// Idempotency key - generate once and persist in sessionStorage
	const getIdempotencyKey = (): string => {
		const storageKey = `order-idempotency-key-${storeId}`;
		const existingKey = sessionStorage.getItem(storageKey);
		if (existingKey) {
			return existingKey;
		}
		const newKey = crypto.randomUUID();
		sessionStorage.setItem(storageKey, newKey);
		return newKey;
	};

	// When order type changes to delivery and shop is closed, clear pickup time if it was set for takeaway
	// (delivery will also need time selection when closed)

	// Payment redirect state
	const [isPaymentRedirecting, setIsPaymentRedirecting] = useState(false);

	// Handler for adding recommendation items
	const handleAddRecommendation = useCallback(
		(item: {
			itemId: string;
			name: string;
			price: number;
			imageUrl: string | null;
		}) => {
			addItem({
				itemId: item.itemId,
				name: item.name,
				basePrice: item.price,
				quantity: 1,
				selectedOptions: [],
				storeId,
				storeSlug,
				imageUrl: item.imageUrl ?? undefined,
				fromRecommendation: true,
			});
			toast.success(
				t("ordering.recommendations.itemAdded", { name: item.name }),
			);
		},
		[addItem, storeId, storeSlug, t],
	);

	// Mutations
	const createOrderMutation = useCreateOrder();
	const createPaymentMutation = useCreatePayment();

	// Check if merchant can accept online payments (computed on server)
	if (!capabilities.canAcceptPayments) {
		return <StoreUnavailable backUrl={`/${storeSlug}`} />;
	}

	// Compute subtotal from items
	const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

	const validateForm = (): boolean => {
		if (!customerName.trim()) {
			toast.error(t("ordering.nameRequired"));
			return false;
		}

		if (items.length === 0) {
			toast.error(t("ordering.cartEmpty"));
			return false;
		}

		// Validate cart items have required fields (catches corrupted localStorage)
		const invalidItems = items.filter(
			(item) => !item.name || typeof item.name !== "string",
		);
		if (invalidItems.length > 0) {
			toast.error(t("ordering.invalidCartItems"));
			clearCart();
			return false;
		}

		// Validate pickup/delivery time for takeaway orders or delivery when closed
		if (
			(orderType === "takeaway" || (orderType === "delivery" && isClosed)) &&
			!scheduledPickupTime
		) {
			toast.error(
				orderType === "takeaway"
					? t("ordering.pickupTimeRequired")
					: t("ordering.deliveryTimeRequired"),
			);
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		const orderItems = items.map((item) => {
			const options = item.selectedOptions.flatMap((group) =>
				group.choices.map((choice) => ({
					optionGroupId: group.groupId,
					optionChoiceId: choice.id,
					quantity: choice.quantity ?? 1,
				})),
			);

			return {
				itemId: item.itemId,
				quantity: item.quantity,
				options: options.length > 0 ? options : undefined,
				fromRecommendation: item.fromRecommendation ?? false,
			};
		});

		const orderInput = {
			storeId,
			items: orderItems,
			orderType,
			customerName: customerName.trim(),
			customerNotes: customerNotes.trim() || undefined,
			scheduledPickupTime: scheduledPickupTime
				? new Date(scheduledPickupTime)
				: undefined,
			idempotencyKey: getIdempotencyKey(),
		};

		try {
			const order = await createOrderMutation.mutateAsync(orderInput);

			const baseUrl = window.location.origin;
			const returnUrl = `${baseUrl}/${storeSlug}/ordering/return`;
			const cancelUrl = `${baseUrl}/${storeSlug}/ordering/cancel`;

			// Create payment and redirect to PayPal approval page
			setIsPaymentRedirecting(true);

			const payment = await createPaymentMutation.mutateAsync({
				orderId: order.id,
				returnUrl,
				cancelUrl,
			});

			if (!payment.approvalUrl) {
				toast.error("Payment provider did not return payment URL");
				setIsPaymentRedirecting(false);
				return;
			}

			// Clear cart and idempotency key before redirect
			clearCart();
			sessionStorage.removeItem(`order-idempotency-key-${storeId}`);
			// Redirect to PayPal approval page
			window.location.href = payment.approvalUrl;
		} catch {
			setIsPaymentRedirecting(false);
			// Error toast handled by mutation
		}
	};

	// Show payment redirect loading state
	if (isPaymentRedirecting) {
		return (
			<Box minH="100vh" bg="bg">
				<PageContainer size="md" py="12">
					<ShopCard padding="lg">
						<VStack gap="4" textAlign="center">
							<Spinner size="xl" color="teal.solid" />
							<ShopHeading as="h1" size="lg">
								{t("ordering.payment.redirecting")}
							</ShopHeading>
							<ShopMutedText>{t("ordering.payment.pleaseWait")}</ShopMutedText>
						</VStack>
					</ShopCard>
				</PageContainer>
			</Box>
		);
	}

	const isSubmitting =
		createOrderMutation.isPending || createPaymentMutation.isPending;

	const isFormValid =
		customerName.trim() &&
		items.length > 0 &&
		(orderType !== "takeaway" || scheduledPickupTime !== null) &&
		!(orderType === "delivery" && isClosed && scheduledPickupTime === null);

	return (
		<Box minH="100vh" bg="bg">
			<PageContainer size="md">
				{/* Header */}
				<ShopHeading as="h1" size="xl" mb="6">
					{t("ordering.title")}
				</ShopHeading>

				<form onSubmit={handleSubmit}>
					<Stack gap="6">
						{/* Closed Status Banner */}
						{isClosed && (
							<ShopCard padding="md" borderColor="red.solid" bg="red.subtle">
								<Stack gap="2">
									<ShopHeading as="h2" size="md" color="red.fg">
										{t("ordering.shopClosed")}
									</ShopHeading>
									<ShopMutedText>{t("ordering.preOrderMessage")}</ShopMutedText>
									{storeStatus?.nextOpenTime && (
										<ShopMutedText textStyle="sm">
											{t("ordering.nextOpenTime", {
												time: formatDateTime(storeStatus.nextOpenTime),
											})}
										</ShopMutedText>
									)}
								</Stack>
							</ShopCard>
						)}

						{/* Order Type Selection - only show if more than one option available */}
						{availableOrderTypes.length > 1 && (
							<CardSection title={t("ordering.orderType")}>
								<Grid
									templateColumns={{
										base: "1fr",
										sm:
											availableOrderTypes.length === 2
												? "repeat(2, 1fr)"
												: "repeat(3, 1fr)",
									}}
									gap="3"
								>
									{availableOrderTypes.map((option) => {
										const isSelected = orderType === option.value;
										const isDisabled = option.disabled;

										return (
											<ShopCard
												key={option.value}
												variant="interactive"
												padding="md"
												cursor={isDisabled ? "not-allowed" : "pointer"}
												opacity={isDisabled ? 0.5 : 1}
												borderWidth={isSelected ? "2px" : "1px"}
												borderColor={isSelected ? "teal.solid" : "border"}
												bg={isSelected ? "teal.subtle" : "bg.panel"}
												_hover={
													!isDisabled
														? {
																borderColor: isSelected
																	? "teal.solid"
																	: "teal.muted",
																bg: isSelected ? "teal.subtle" : "bg.muted",
															}
														: undefined
												}
												onClick={() =>
													!isDisabled && setOrderType(option.value as OrderType)
												}
												onKeyDown={(e) => {
													if (
														!isDisabled &&
														(e.key === "Enter" || e.key === " ")
													) {
														e.preventDefault();
														setOrderType(option.value as OrderType);
													}
												}}
												role="button"
												tabIndex={isDisabled ? -1 : 0}
												aria-pressed={isSelected}
												aria-disabled={isDisabled}
											>
												<Flex align="center" gap="3">
													{/* Radio indicator */}
													<Center
														w="5"
														h="5"
														flexShrink={0}
														rounded="full"
														borderWidth="2px"
														borderColor={isSelected ? "teal.solid" : "border"}
														bg={isSelected ? "teal.solid" : "transparent"}
														opacity={isDisabled ? 0.5 : 1}
													>
														{isSelected && (
															<Box w="2" h="2" rounded="full" bg="white" />
														)}
													</Center>
													{/* Label */}
													<ShopText
														fontWeight="medium"
														opacity={isDisabled ? 0.5 : 1}
													>
														{option.label}
													</ShopText>
												</Flex>
											</ShopCard>
										);
									})}
								</Grid>
							</CardSection>
						)}

						{/* Pickup/Delivery Time Selection (for takeaway orders, or delivery when closed) */}
						{(orderType === "takeaway" ||
							(orderType === "delivery" && isClosed)) && (
							<CardSection
								title={
									orderType === "takeaway"
										? t("ordering.pickupTime")
										: t("ordering.deliveryTime")
								}
							>
								<PickupTimeSelector
									storeSlug={storeSlug}
									value={scheduledPickupTime}
									onChange={setScheduledPickupTime}
									isRequired={true}
									minDate={
										isClosed && storeStatus?.nextOpenTime
											? storeStatus.nextOpenTime
											: undefined
									}
								/>
							</CardSection>
						)}

						{/* Customer Info */}
						<CardSection title={t("ordering.yourInfo")}>
							<Field.Root>
								<Field.Label>
									<ShopText fontWeight="medium" textStyle="sm">
										{t("ordering.yourName")}
									</ShopText>
								</Field.Label>
								<Input
									id="customerName"
									type="text"
									value={customerName}
									onChange={(e) => setCustomerName(e.target.value)}
									placeholder={t("ordering.namePlaceholder")}
									w="full"
									autoComplete="name"
								/>
							</Field.Root>

							<Field.Root>
								<Field.Label>
									<ShopText fontWeight="medium" textStyle="sm">
										{t("ordering.specialRequests")}
										<Box as="span" ms="1" fontWeight="normal" color="fg.muted">
											({t("ordering.optional")})
										</Box>
									</ShopText>
								</Field.Label>
								<Textarea
									id="customerNotes"
									value={customerNotes}
									onChange={(e) => setCustomerNotes(e.target.value)}
									placeholder={t("ordering.specialRequestsPlaceholder")}
									minH="80px"
									w="full"
									resize="none"
									maxLength={500}
								/>
							</Field.Root>
						</CardSection>

						{/* AI Recommendations */}
						<RecommendationsSection
							storeSlug={storeSlug}
							cartItems={items}
							languageCode={i18n.language ?? "de"}
							onAddItem={handleAddRecommendation}
						/>

						{/* Order Summary */}
						<CardSection title={t("ordering.orderSummary")}>
							{/* Cart items */}
							<Stack gap="3">
								{items.map((item) => (
									<Flex key={item.id} justify="space-between" textStyle="sm">
										<Box flex="1">
											<Box as="span" fontWeight="medium">
												{item.quantity}x {item.name}
											</Box>
											{item.selectedOptions.length > 0 && (
												<ShopMutedText textStyle="xs">
													{item.selectedOptions
														.flatMap((g) => g.choices.map((c) => c.name))
														.join(", ")}
												</ShopMutedText>
											)}
										</Box>
										<ShopPrice cents={item.totalPrice} />
									</Flex>
								))}
							</Stack>

							{/* Pickup/Delivery Time Display */}
							{(orderType === "takeaway" ||
								(orderType === "delivery" && isClosed)) &&
								scheduledPickupTime && (
									<Stack
										gap="2"
										borderTopWidth="1px"
										borderColor="border"
										pt="3"
									>
										<ShopMutedText textStyle="sm">
											{isClosed
												? orderType === "takeaway"
													? t("ordering.preOrderFor", {
															time: formatDateTime(scheduledPickupTime),
														})
													: t("ordering.preOrderDeliveryFor", {
															time: formatDateTime(scheduledPickupTime),
														})
												: orderType === "takeaway"
													? t("ordering.scheduledPickup", {
															time: formatDateTime(scheduledPickupTime),
														})
													: t("ordering.scheduledDelivery", {
															time: formatDateTime(scheduledPickupTime),
														})}
										</ShopMutedText>
									</Stack>
								)}

							{/* Totals */}
							<Stack gap="2" borderTopWidth="1px" borderColor="border" pt="3">
								<ShopPriceRow
									label={t("ordering.subtotal")}
									cents={subtotal}
									variant="total"
								/>
							</Stack>
						</CardSection>

						{/* Submit Button */}
						<ShopButton
							type="submit"
							variant="primary"
							size="lg"
							w="full"
							disabled={isSubmitting || !isFormValid}
						>
							{isSubmitting
								? t("ordering.submitting")
								: t("ordering.proceedToPayment")}
						</ShopButton>
					</Stack>
				</form>
			</PageContainer>
		</Box>
	);
}
