import type { AppRouter } from "@menuvo/api/trpc";
import { Input } from "@menuvo/ui/components/input";
import { Label } from "@menuvo/ui/components/label";
import { Textarea } from "@menuvo/ui/components/textarea";
import { cn } from "@menuvo/ui/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import i18n from "i18next";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { MerchantCapabilities } from "../../../lib/capabilities";
import type { TrpcClient } from "../../../lib/trpc";
import { useCartStore } from "../../cart/stores/cart-store";
import { StoreUnavailable } from "../../shared/components/store-unavailable";
import {
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

			const returnUrl = `${window.location.origin}/${storeSlug}/ordering/return`;

			// Create payment and redirect to hosted payment page
			setIsPaymentRedirecting(true);

			const payment = await createPaymentMutation.mutateAsync({
				orderId: order.id,
				returnUrl,
			});

			if (!payment.checkoutUrl) {
				toast.error("Payment provider did not return payment URL");
				setIsPaymentRedirecting(false);
				return;
			}

			// Clear cart and idempotency key before redirect
			clearCart();
			sessionStorage.removeItem(`order-idempotency-key-${storeId}`);
			// Redirect to hosted payment page
			window.location.href = payment.checkoutUrl;
		} catch {
			setIsPaymentRedirecting(false);
			// Error toast handled by mutation
		}
	};

	// Show payment redirect loading state
	if (isPaymentRedirecting) {
		return (
			<div className="min-h-screen bg-background">
				<div className="mx-auto max-w-2xl px-4 py-12">
					<ShopCard padding="lg" className="space-y-4 text-center">
						<Loader2 className="mx-auto size-12 animate-spin text-primary" />
						<ShopHeading as="h1" size="lg">
							{t("ordering.payment.redirecting")}
						</ShopHeading>
						<ShopMutedText>{t("ordering.payment.pleaseWait")}</ShopMutedText>
					</ShopCard>
				</div>
			</div>
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
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-2xl px-4 py-6">
				{/* Header */}
				<ShopHeading as="h1" size="xl" className="mb-6">
					{t("ordering.title")}
				</ShopHeading>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Closed Status Banner */}
					{isClosed && (
						<ShopCard
							padding="md"
							className="space-y-2 border-destructive bg-destructive/10"
						>
							<ShopHeading as="h2" size="md" className="text-destructive">
								{t("ordering.shopClosed")}
							</ShopHeading>
							<ShopMutedText>{t("ordering.preOrderMessage")}</ShopMutedText>
							{storeStatus?.nextOpenTime && (
								<ShopMutedText className="text-sm">
									{t("ordering.nextOpenTime", {
										time: formatDateTime(storeStatus.nextOpenTime),
									})}
								</ShopMutedText>
							)}
						</ShopCard>
					)}

					{/* Order Type Selection - only show if more than one option available */}
					{availableOrderTypes.length > 1 && (
						<ShopCard padding="md" className="space-y-4">
							<ShopHeading as="h2" size="md">
								{t("ordering.orderType")}
							</ShopHeading>

							<div
								className={cn(
									"grid grid-cols-1 gap-3",
									availableOrderTypes.length === 2
										? "sm:grid-cols-2"
										: "sm:grid-cols-3",
								)}
							>
								{availableOrderTypes.map((option) => {
									const isSelected = orderType === option.value;
									const isDisabled = option.disabled;

									return (
										<ShopCard
											key={option.value}
											variant="interactive"
											padding="md"
											className={cn(
												"cursor-pointer transition-all",
												isSelected
													? "border-2 border-primary bg-primary/10"
													: "border border-border hover:border-primary/50 hover:bg-muted/50",
												isDisabled && "cursor-not-allowed opacity-50",
											)}
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
											<div className="flex items-center gap-3">
												{/* Radio indicator */}
												<div
													className={cn(
														"flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
														isSelected
															? "border-primary bg-primary"
															: "border-border",
														isDisabled && "opacity-50",
													)}
												>
													{isSelected && (
														<div className="size-2 rounded-full bg-white" />
													)}
												</div>
												{/* Label */}
												<ShopText
													className={cn(
														"font-medium",
														isSelected ? "text-foreground" : "text-foreground",
														isDisabled && "opacity-50",
													)}
												>
													{option.label}
												</ShopText>
											</div>
										</ShopCard>
									);
								})}
							</div>
						</ShopCard>
					)}

					{/* Pickup/Delivery Time Selection (for takeaway orders, or delivery when closed) */}
					{(orderType === "takeaway" ||
						(orderType === "delivery" && isClosed)) && (
						<ShopCard padding="md" className="space-y-4">
							<ShopHeading as="h2" size="md">
								{orderType === "takeaway"
									? t("ordering.pickupTime")
									: t("ordering.deliveryTime")}
							</ShopHeading>
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
						</ShopCard>
					)}

					{/* Customer Info */}
					<ShopCard padding="md" className="space-y-4">
						<ShopHeading as="h2" size="md">
							{t("ordering.yourInfo")}
						</ShopHeading>

						<div>
							<Label htmlFor="customerName">
								<ShopText className="font-medium text-sm">
									{t("ordering.yourName")}
								</ShopText>
							</Label>
							<Input
								id="customerName"
								type="text"
								value={customerName}
								onChange={(e) => setCustomerName(e.target.value)}
								placeholder={t("ordering.namePlaceholder")}
								className="mt-1 w-full"
								autoComplete="name"
							/>
						</div>

						<div>
							<Label htmlFor="customerNotes">
								<ShopText className="font-medium text-sm">
									{t("ordering.specialRequests")}
									<span className="ms-1 font-normal text-muted-foreground">
										({t("ordering.optional")})
									</span>
								</ShopText>
							</Label>
							<Textarea
								id="customerNotes"
								value={customerNotes}
								onChange={(e) => setCustomerNotes(e.target.value)}
								placeholder={t("ordering.specialRequestsPlaceholder")}
								className="mt-1 min-h-[80px] w-full resize-none"
								maxLength={500}
							/>
						</div>
					</ShopCard>

					{/* AI Recommendations */}
					<RecommendationsSection
						storeSlug={storeSlug}
						cartItems={items}
						languageCode={i18n.language ?? "de"}
						onAddItem={handleAddRecommendation}
					/>

					{/* Order Summary */}
					<ShopCard padding="md" className="space-y-4">
						<ShopHeading as="h2" size="md">
							{t("ordering.orderSummary")}
						</ShopHeading>

						{/* Cart items */}
						<div className="space-y-3">
							{items.map((item) => (
								<div key={item.id} className="flex justify-between text-sm">
									<div className="flex-1">
										<span className="font-medium">
											{item.quantity}x {item.name}
										</span>
										{item.selectedOptions.length > 0 && (
											<ShopMutedText className="text-xs">
												{item.selectedOptions
													.flatMap((g) => g.choices.map((c) => c.name))
													.join(", ")}
											</ShopMutedText>
										)}
									</div>
									<ShopPrice cents={item.totalPrice} />
								</div>
							))}
						</div>

						{/* Pickup/Delivery Time Display */}
						{(orderType === "takeaway" ||
							(orderType === "delivery" && isClosed)) &&
							scheduledPickupTime && (
								<div className="space-y-2 border-border border-t pt-3">
									<ShopMutedText className="text-sm">
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
								</div>
							)}

						{/* Totals */}
						<div className="space-y-2 border-border border-t pt-3">
							<ShopPriceRow
								label={t("ordering.subtotal")}
								cents={subtotal}
								variant="total"
							/>
						</div>
					</ShopCard>

					{/* Submit Button */}
					<ShopButton
						type="submit"
						variant="primary"
						size="lg"
						className="w-full"
						disabled={isSubmitting || !isFormValid}
					>
						{isSubmitting
							? t("ordering.submitting")
							: t("ordering.proceedToPayment")}
					</ShopButton>
				</form>
			</div>
		</div>
	);
}
